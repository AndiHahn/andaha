import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { SheetDragDirective } from 'src/app/core/overlay/sheet-drag.directive';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';

export const DEFAULT_LIVING_COST_SHARE = 35;

export interface LivingCostSheetData {
  /** Monatliches Einkommen, Grundlage für den Hinweis „Entspricht … € im Monat“ */
  income: number;
  /** Aktuell gespeicherter Anteil in ganzen Prozent */
  share: number;
}

const integerValidator: ValidatorFn = control =>
  control.value === null || Number.isInteger(control.value) ? null : { integer: true };

/**
 * Anteil der Lebenserhaltungskosten am Einkommen (AC8, Mockup 02 A): mobil als Bottom Sheet, ab 1024 px
 * als Dialog (geöffnet von der Übersicht). Schließt mit dem gespeicherten Anteil als Ergebnis.
 */
@Component({
  selector: 'app-living-cost-sheet',
  templateUrl: './living-cost-sheet.component.html',
  styleUrls: ['./living-cost-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '[class.dialog]': 'dialogMode' },
  imports: [ReactiveFormsModule, DecimalPipe, MatIcon, MatProgressSpinner, SheetDragDirective]
})
export class LivingCostSheetComponent {
  readonly sheetRef = inject(MatBottomSheetRef, { optional: true });
  private readonly dialogRef = inject(MatDialogRef, { optional: true });
  readonly dialogMode = !this.sheetRef && !!this.dialogRef;

  private readonly data: LivingCostSheetData =
    inject(MAT_BOTTOM_SHEET_DATA, { optional: true }) ?? inject(MAT_DIALOG_DATA);
  private readonly api = inject(BudgetPlanApiService);
  private readonly snackbar = inject(MatSnackBar);

  readonly defaultShare = DEFAULT_LIVING_COST_SHARE;
  readonly saving = signal(false);

  readonly share = new FormControl<number | null>(this.data.share, [
    Validators.required, Validators.min(0), Validators.max(100), integerValidator
  ]);
  private readonly shareValue = toSignal(this.share.valueChanges, { initialValue: this.share.value });

  /** Monatsbetrag zum eingegebenen Anteil (0 solange die Eingabe ungültig ist) */
  readonly amount = computed(() => {
    const value = this.shareValue();
    return value !== null && this.share.valid ? Math.round(this.data.income * value) / 100 : 0;
  });

  save(): void {
    if (this.share.invalid || this.saving()) {
      return;
    }
    const value = this.share.value!;
    this.saving.set(true);
    this.api.updateBudgetPlanSettings(value).subscribe({
      next: () => {
        this.saving.set(false);
        this.close(value);
      },
      error: () => {
        this.saving.set(false);
        openErrorSnackbar('Anteil konnte nicht gespeichert werden.', this.snackbar);
      }
    });
  }

  close(result?: number): void {
    if (this.sheetRef) {
      this.sheetRef.dismiss(result);
    } else {
      this.dialogRef?.close(result);
    }
  }
}
