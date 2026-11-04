import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { SheetService } from 'src/app/core/overlay/sheet.service';
import { QuickEntrySheetComponent } from './quick-entry-sheet/quick-entry-sheet.component';

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

  open(): void {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    const closed = () => this.isOpen = false;

    if (this.breakpoints.isMatched(DESKTOP)) {
      this.dialog.open(QuickEntrySheetComponent, {
        panelClass: ['andaha-dialog', 'quick-entry-dialog'],
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Neue Rechnung',
        autoFocus: 'input[name="amount"]'
      }).afterClosed().subscribe(closed);
    } else {
      this.sheet.open(QuickEntrySheetComponent, {
        panelClass: 'quick-entry-sheet',
        ariaLabel: 'Neue Rechnung'
      }).afterDismissed().subscribe(closed);
    }
  }
}
