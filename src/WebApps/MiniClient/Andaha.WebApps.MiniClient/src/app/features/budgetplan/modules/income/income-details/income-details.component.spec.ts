import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { IncomeContextService } from '../../../services/income-context.service';
import { IncomeHistoryDialogService } from '../income-history-dialog/income-history-dialog.service';
import { IncomeDetailsComponent } from './income-details.component';

registerLocaleData(localeDe, 'de');

describe('IncomeDetailsComponent delete', () => {
  let fixture: ComponentFixture<IncomeDetailsComponent>;
  let leaveTo: ReturnType<typeof vi.fn>;
  let openSnackbar: ReturnType<typeof vi.fn>;
  let deleteIncome: ReturnType<typeof vi.fn>;
  let vibrate: ReturnType<typeof vi.spyOn>;

  const income: IncomeDto = { id: 'i-1', name: 'Gehalt Test', value: 2500, duration: Duration.Monthly };

  beforeEach(async () => {
    leaveTo = vi.fn();
    openSnackbar = vi.fn();
    deleteIncome = vi.fn();
    vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, IncomeDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: MatSnackBar, useValue: { openFromComponent: openSnackbar } },
        { provide: IncomeContextService, useValue: { byId: () => of(income), deleteIncome } },
        { provide: PageTitleService, useValue: { set: vi.fn(), setAction: vi.fn() } },
        { provide: ConfirmationDialogService, useValue: { openDialog: () => Promise.resolve({ afterClosed: () => of(true) }) } },
        { provide: IncomeHistoryDialogService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'i-1' }, children: [], parent: null } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncomeDetailsComponent);
    fixture.detectChanges();
  });

  afterEach(() => vibrate.mockRestore());

  it('vibrates and leaves to the list after a successful delete (AC35)', async () => {
    deleteIncome.mockReturnValue(of(undefined));

    fixture.componentInstance.onDeleteClick();
    await fixture.whenStable();

    expect(deleteIncome).toHaveBeenCalledWith('i-1');
    expect(vibrate).toHaveBeenCalledWith(30);
    expect(leaveTo).toHaveBeenCalledWith('/budgetplan/income');
  });

  it('delete failed: error snackbar, no vibration', async () => {
    deleteIncome.mockReturnValue(throwError(() => new Error('fail')));

    fixture.componentInstance.onDeleteClick();
    await fixture.whenStable();

    expect(openSnackbar).toHaveBeenCalled();
    expect(vibrate).not.toHaveBeenCalled();
    expect(leaveTo).not.toHaveBeenCalled();
  });
});
