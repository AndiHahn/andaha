import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { AnalyzeBillResultDto } from 'src/app/api/shopping/dtos/AnalyzeBillResultDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { BillCreatePrefill } from '../models/bill-create-prefill';
import { toDayKey } from '../quick-entry/logic/quick-entry-state';
import { ScanOverlayComponent, ScanOverlayData } from './scan-overlay/scan-overlay.component';

/** Zeitlimit der Analyse im Frontend (design.md §5.1) */
export const SCAN_TIMEOUT_MS = 30_000;

const NOT_READABLE = 'Das Foto konnte nicht gelesen werden.';

type ScanOutcome =
  | { kind: 'success'; result: AnalyzeBillResultDto }
  | { kind: 'failed' }
  | { kind: 'cancelled' };

/** Kalendertag `YYYY-MM-DD` aus dem Datum der Analyse; so wie geliefert, ohne Umrechnung in die lokale Zone */
function toIsoDay(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const day = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
  if (day) {
    return day;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : toDayKey(date);
}

/** Vorbelegung des großen Formulars aus dem Analyse-Ergebnis; fehlende Felder bleiben undefined */
export function mapAnalyzeResultToPrefill(result: AnalyzeBillResultDto, image: File): BillCreatePrefill {
  const prefill: BillCreatePrefill = { image };

  const shopName = result.shopName?.trim();
  if (shopName) {
    prefill.shopName = shopName;
  }
  const date = toIsoDay(result.date);
  if (date) {
    prefill.date = date;
  }
  if (typeof result.totalAmount === 'number' && Number.isFinite(result.totalAmount)) {
    prefill.price = result.totalAmount;
  }
  if (result.categoryId) {
    prefill.categoryId = result.categoryId;
    if (result.subCategoryId) {
      prefill.subCategoryId = result.subCategoryId;
    }
  }
  return prefill;
}

function hasFields(prefill: BillCreatePrefill): boolean {
  return prefill.shopName !== undefined || prefill.date !== undefined
    || prefill.price !== undefined || prefill.categoryId !== undefined;
}

/**
 * „Rechnung scannen“ (AC30, AC31): Foto verkleinern, Vollbild-Ladezustand, Analyse mit Zeitlimit,
 * danach das große Formular `/bill/create` – vorbefüllt (Erfolg), nur mit Foto und Hinweis (Fehler,
 * Zeitüberschreitung, kein Netz) oder nur mit Foto (Abbrechen bzw. Zurück).
 */
@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly billApi = inject(BillApiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  private running = false;

  async start(file: File): Promise<void> {
    // Doppeltipp bzw. zweites Foto während eines laufenden Scans
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const image = await compressImage(file);
      // nicht dekodierbar (kein Bild, Format ohne Browser-Unterstützung): compressImage gibt die Datei unverändert zurück
      if (image.type !== 'image/jpeg') {
        openErrorSnackbar(NOT_READABLE, this.snackbar);
        return;
      }

      // ohne Netz scheitert die Analyse sicher: kein Ladezustand, gleich das Formular mit Hinweis
      const outcome: ScanOutcome = navigator.onLine ? await this.analyze(image) : { kind: 'failed' };
      await this.router.navigate(['/bill/create'], { state: { prefill: this.prefillFor(outcome, image) } });
    } finally {
      this.running = false;
    }
  }

  private prefillFor(outcome: ScanOutcome, image: File): BillCreatePrefill {
    switch (outcome.kind) {
      case 'success': {
        const prefill = mapAnalyzeResultToPrefill(outcome.result, image);
        return hasFields(prefill) ? prefill : { image, notice: 'analysis-failed' };
      }
      case 'failed':
        return { image, notice: 'analysis-failed' };
      case 'cancelled':
        return { image };
    }
  }

  /**
   * Analyse unter dem Vollbild-Overlay. Das Overlay ist ein Dialog und damit beim OverlayBackService
   * angemeldet: „Abbrechen“ und Zurück schließen es und bestellen den Request ab. Bei Ergebnis oder
   * Fehler wird es vor der Navigation geschlossen (Dialoge schließen nicht selbst bei Navigation).
   */
  private async analyze(image: File): Promise<ScanOutcome> {
    const ref = this.dialog.open<ScanOverlayComponent, ScanOverlayData>(ScanOverlayComponent, {
      data: { image },
      panelClass: 'andaha-scan',
      width: '100vw',
      maxWidth: '100vw',
      height: '100%',
      maxHeight: '100%',
      ariaLabel: 'Rechnung scannen'
    });

    const outcome = await new Promise<ScanOutcome>(resolve => {
      let settled = false;
      const finish = (result: ScanOutcome) => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      };

      const request = this.billApi.analyzeBill(image).pipe(timeout(SCAN_TIMEOUT_MS)).subscribe({
        next: result => finish({ kind: 'success', result }),
        error: error => {
          console.error('Analyzing bill failed', error);
          finish({ kind: 'failed' });
        }
      });

      ref.afterClosed().subscribe(() => {
        request.unsubscribe();
        finish({ kind: 'cancelled' });
      });
    });

    if (outcome.kind !== 'cancelled') {
      ref.close();
    }
    return outcome;
  }
}
