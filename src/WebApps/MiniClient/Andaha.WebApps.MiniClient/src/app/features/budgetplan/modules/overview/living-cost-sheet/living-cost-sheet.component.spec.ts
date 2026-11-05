import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { ErrorSnackbarComponent } from 'src/app/shared/snackbar/error-snackbar/error-snackbar.component';
import { LivingCostSheetComponent } from './living-cost-sheet.component';

registerLocaleData(localeDe, 'de');

describe('LivingCostSheetComponent', () => {
  let fixture: ComponentFixture<LivingCostSheetComponent>;
  let api: { updateBudgetPlanSettings: ReturnType<typeof vi.fn> };
  let sheetRef: { dismiss: ReturnType<typeof vi.fn> };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };

  const el = () => fixture.nativeElement as HTMLElement;
  const input = () => el().querySelector<HTMLInputElement>('input')!;
  const saveButton = () => el().querySelector<HTMLButtonElement>('button[type="submit"]')!;

  function type(value: string): void {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    api = { updateBudgetPlanSettings: vi.fn().mockReturnValue(of(undefined)) };
    sheetRef = { dismiss: vi.fn() };
    snackbar = { openFromComponent: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LivingCostSheetComponent],
      providers: [
        { provide: BudgetPlanApiService, useValue: api },
        { provide: MatBottomSheetRef, useValue: sheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { income: 4200, share: 35 } },
        { provide: MatSnackBar, useValue: snackbar }
      ]
    });
    fixture = TestBed.createComponent(LivingCostSheetComponent);
    fixture.detectChanges();
  });

  it('shows the saved share and the monthly amount hint', () => {
    expect(input().value).toBe('35');
    expect(el().textContent).toContain('Entspricht 1.470,00 € im Monat. Standard: 35 %.');
  });

  it('updates the hint while typing', () => {
    type('10');

    expect(el().textContent).toContain('Entspricht 420,00 € im Monat.');
  });

  it('saves the share and closes with it', () => {
    type('40');

    saveButton().click();

    expect(api.updateBudgetPlanSettings).toHaveBeenCalledWith(40);
    expect(sheetRef.dismiss).toHaveBeenCalledWith(40);
  });

  it('rejects values outside 0 to 100 and non-integers', () => {
    for (const value of ['101', '-1', '12.5', '']) {
      type(value);

      expect(saveButton().disabled, value).toBe(true);
    }
    saveButton().click();

    expect(api.updateBudgetPlanSettings).not.toHaveBeenCalled();

    type('0');
    expect(saveButton().disabled).toBe(false);
    type('100');
    expect(saveButton().disabled).toBe(false);
  });

  it('shows an error snackbar and stays open when saving fails', () => {
    api.updateBudgetPlanSettings.mockReturnValue(throwError(() => new Error('fail')));
    type('40');

    saveButton().click();

    expect(snackbar.openFromComponent).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Anteil konnte nicht gespeichert werden.' }));
    expect(sheetRef.dismiss).not.toHaveBeenCalled();
  });
});
