import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { SubCategoryDto } from 'src/app/api/shopping/dtos/SubCategoryDto';
import { BillCreatePrefill } from 'src/app/features/bill/models/bill-create-prefill';
import { toDayKey } from 'src/app/features/bill/quick-entry/logic/quick-entry-state';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { confidencePercent, resolveAnalyzedCategory } from '../../functions/analyzed-bill-functions';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AnalyzedBillImageComponent } from '../analyzed-bill-image/analyzed-bill-image.component';
import { DecimalPipe, DatePipe } from '@angular/common';

const DISCARD_QUESTION = 'Soll die analysierte Rechnung samt Foto wirklich verworfen werden?';
const DISCARD_FAILED = 'Analyse konnte nicht verworfen werden.';
const IMAGE_FAILED = 'Foto konnte nicht geladen werden.';

/**
 * Detailansicht einer Analyse (AC32–AC34): Werte, Positionen, Foto im Pinch-Zoom-Dialog der
 * Rechnungen; „Als Rechnung übernehmen“ öffnet das große Formular vorbefüllt (es löscht die Analyse
 * nach dem Speichern), „Verwerfen“ löscht sie nach Rückfrage.
 */
@Component({
    selector: 'app-analyzed-bill-details',
    templateUrl: './analyzed-bill-details.component.html',
    styleUrls: ['./analyzed-bill-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressBar, MatIcon, AnalyzedBillImageComponent, DecimalPipe, DatePipe]
})
export class AnalyzedBillDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private billApi = inject(BillApiService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private analyzedContext = inject(AnalyzedBillContextService);
  private categoryContext = inject(BillCategoryContextService);

  bill?: BillAnalyzedDto;
  category?: CategoryDto;
  subCategory?: SubCategoryDto;
  confidence: number | null = null;
  /** Foto wird für die Übernahme geladen bzw. die Analyse wird verworfen */
  busy: boolean = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const billId = getParametersFromRouteRecursive(this.route.snapshot)['id'];
    if (!billId) {
      leaveDetailNotFound(this.router, this.snackbar, '/bill/analysis');
      return;
    }

    this.analyzedContext.byId(billId).pipe(takeUntil(this.destroy$)).subscribe(bill => {
      if (!bill) {
        leaveDetailNotFound(this.router, this.snackbar, '/bill/analysis');
        return;
      }

      this.bill = bill;
      this.confidence = confidencePercent(bill.confidence);

      this.categoryContext.categories().pipe(takeUntil(this.destroy$)).subscribe(categories => {
        const resolved = resolveAnalyzedCategory(categories, bill.categoryId, bill.subCategoryId);
        this.category = resolved.category;
        this.subCategory = resolved.subCategory;
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  /** AC33: großes Formular mit den Werten, dem (vom Server geladenen) Foto und der Analyse-ID */
  async onTakeOverClick(): Promise<void> {
    const bill = this.bill;
    if (!bill || this.busy) {
      return;
    }

    this.busy = true;
    try {
      const prefill = this.prefillOf(bill);
      if (bill.imageAvailable) {
        const image = await this.loadImage(bill.id);
        if (!image) {
          return;
        }
        prefill.image = image;
      }

      await this.router.navigate(['/bill/create'], { state: { prefill } });
    } finally {
      this.busy = false;
    }
  }

  /** AC33: nach Rückfrage löschen (Eintrag, Positionen und Foto) */
  async onDiscardClick(): Promise<void> {
    const bill = this.bill;
    if (!bill || this.busy) {
      return;
    }

    const dialogRef = await this.confirmationDialog.openDialog({ text: DISCARD_QUESTION });
    const confirmed = await firstValueFrom(dialogRef.afterClosed(), { defaultValue: false });
    if (!confirmed) {
      return;
    }

    this.busy = true;
    try {
      await firstValueFrom(this.billApi.deleteAnalyzedBill(bill.id), { defaultValue: undefined });
    } catch (error) {
      // schon weg (z. B. auf einem anderen Gerät verworfen): wie verworfen behandeln
      if (!(error instanceof HttpErrorResponse && error.status === 404)) {
        console.error('Discarding analyzed bill failed', error);
        openErrorSnackbar(DISCARD_FAILED, this.snackbar);
        this.busy = false;
        return;
      }
    }

    this.analyzedContext.remove(bill.id);
    this.busy = false;
    void this.router.navigateByUrl('/bill/analysis');
  }

  private prefillOf(bill: BillAnalyzedDto): BillCreatePrefill {
    const prefill: BillCreatePrefill = { analyzedBillId: bill.id };
    const shopName = bill.shopName?.trim();
    if (shopName) {
      prefill.shopName = shopName;
    }
    if (typeof bill.price === 'number') {
      prefill.price = bill.price;
    }
    if (bill.date) {
      prefill.date = toDayKey(bill.date);
    }
    if (bill.categoryId) {
      prefill.categoryId = bill.categoryId;
      if (bill.subCategoryId) {
        prefill.subCategoryId = bill.subCategoryId;
      }
    }
    return prefill;
  }

  /** Foto als Datei für das Formular; nicht ladbar oder leer: Fehlermeldung und undefined */
  private async loadImage(id: string): Promise<File | undefined> {
    try {
      const blob = await firstValueFrom(this.billApi.downloadAnalyzedBillImage(id));
      if (blob.size > 0) {
        return new File([blob], 'image', { type: blob.type || 'image/jpeg' });
      }
    } catch (error) {
      console.error('Loading analyzed bill image failed', error);
    }
    openErrorSnackbar(IMAGE_FAILED, this.snackbar);
    return undefined;
  }
}
