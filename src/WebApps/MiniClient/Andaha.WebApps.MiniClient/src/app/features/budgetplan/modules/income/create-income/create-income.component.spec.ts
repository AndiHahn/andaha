import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { SuccessSnackbarComponent } from 'src/app/shared/snackbar/success-snackbar/success-snackbar.component';
import { IncomeContextService } from '../../../services/income-context.service';
import { CreateIncomeComponent } from './create-income.component';

describe('CreateIncomeComponent', () => {
  let fixture: ComponentFixture<CreateIncomeComponent>;
  let created$: Subject<void>;
  let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    created$ = new Subject<void>();
    historyTrail = { leaveTo: vi.fn() };
    snackbar = { openFromComponent: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CreateIncomeComponent, NoopAnimationsModule],
      providers: [
        { provide: IncomeContextService, useValue: { createIncome: vi.fn().mockReturnValue(created$.asObservable()) } },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: snackbar }
      ]
    });
    fixture = TestBed.createComponent(CreateIncomeComponent);
    fixture.detectChanges();
  });

  it('labels the amount field "Betrag"', () => {
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.field-label')).map(l => l.textContent!.trim());

    expect(labels).toContain('Betrag');
    expect(labels).not.toContain('Kosten');
  });

  it('create shows snackbar "Gespeichert · <Name>" and leaves to list', () => {
    fixture.componentInstance.form.setValue({ name: 'ZZ Gehalt', duration: Duration.Monthly, value: 3000 });

    fixture.componentInstance.onSubmit();
    created$.next();

    expect(snackbar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, expect.objectContaining({ data: 'Gespeichert · ZZ Gehalt' }));
    expect(historyTrail.leaveTo).toHaveBeenCalledWith('/budgetplan/income');
  });
});
