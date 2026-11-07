import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, take } from 'rxjs';
import { SheetService } from 'src/app/core/overlay/sheet.service';
import { QuickEntrySheetComponent } from './quick-entry-sheet/quick-entry-sheet.component';

export interface QuickEntryOptions {
  /** Nicht interaktive Vorschau ohne Entwurf lesen/schreiben (Schnellhilfe-Tour) */
  preview?: boolean;
}

export interface QuickEntryHandle {
  /** Schließt Sheet/Dialog (ohne Wirkung, wenn schon zu) */
  close(): void;
  /** Meldet einmal und endet, sobald Sheet/Dialog aus irgendeinem Grund geschlossen ist */
  readonly closed$: Observable<void>;
}

/** Desktop-Breakpoint wie AppComponent */
const DESKTOP = '(min-width: 1024px)';

/**
 * Öffnet die Schnellerfassung: mobil als Bottom Sheet mit eigener Zifferntastatur, ab 1024 px als
 * zentrierter Dialog (480 px) mit normaler Tastatureingabe (AC9, AC19). Höchstens eine gleichzeitig.
 */
@Injectable({ providedIn: 'root' })
export class QuickEntryService {
  private readonly sheet = inject(SheetService);
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);

  private isOpen = false;

  /** `null`, wenn bereits eine Schnellerfassung offen ist */
  open(options: QuickEntryOptions = {}): QuickEntryHandle | null {
    if (this.isOpen) {
      return null;
    }
    this.isOpen = true;
    const closed = () => this.isOpen = false;
    // Vorschau: Daten-Token für das Sheet, kein Autofokus (die Tour darf nichts fokussieren oder schreiben)
    const data = options.preview ? { preview: true } : undefined;

    if (this.breakpoints.isMatched(DESKTOP)) {
      const ref = this.dialog.open(QuickEntrySheetComponent, {
        panelClass: ['andaha-dialog', 'quick-entry-dialog'],
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Neue Rechnung',
        autoFocus: options.preview ? false : 'input[name="amount"]',
        data
      });
      ref.afterClosed().subscribe(closed);
      return { close: () => ref.close(), closed$: ref.afterClosed().pipe(take(1), map(() => undefined)) };
    }
    const ref = this.sheet.open(QuickEntrySheetComponent, {
      panelClass: 'quick-entry-sheet',
      ariaLabel: 'Neue Rechnung',
      data
    });
    ref.afterDismissed().subscribe(closed);
    return { close: () => ref.dismiss(), closed$: ref.afterDismissed().pipe(take(1), map(() => undefined)) };
  }
}
