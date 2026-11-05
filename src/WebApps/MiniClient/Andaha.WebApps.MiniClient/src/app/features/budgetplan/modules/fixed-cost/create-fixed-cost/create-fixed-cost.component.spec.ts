import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { SuccessSnackbarComponent } from 'src/app/shared/snackbar/success-snackbar/success-snackbar.component';
import { FixedCostContextService } from '../../../services/fixed-cost-context.service';
import { CreateFixedCostComponent } from './create-fixed-cost.component';

describe('CreateFixedCostComponent', () => {
  let fixture: ComponentFixture<CreateFixedCostComponent>;
  let created$: Subject<void>;
  let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };
  let vibrate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    created$ = new Subject<void>();
    historyTrail = { leaveTo: vi.fn() };
    snackbar = { openFromComponent: vi.fn() };
    vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });

    TestBed.configureTestingModule({
      imports: [CreateFixedCostComponent, NoopAnimationsModule],
      providers: [
        { provide: FixedCostContextService, useValue: { createFixedCost: vi.fn().mockReturnValue(created$.asObservable()) } },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: snackbar }
      ]
    });
    fixture = TestBed.createComponent(CreateFixedCostComponent);
    fixture.detectChanges();
  });

  it('create shows snackbar "Gespeichert · <Name>" and leaves to list', () => {
    fixture.componentInstance.form.setValue({ name: 'ZZ Miete', category: CostCategory.FlatAndOperating, duration: Duration.Monthly, value: 500 });

    fixture.componentInstance.onSubmit();
    created$.next();

    expect(snackbar.openFromComponent).toHaveBeenCalledWith(SuccessSnackbarComponent, expect.objectContaining({ data: 'Gespeichert · ZZ Miete' }));
    expect(vibrate).toHaveBeenCalled();
    expect(historyTrail.leaveTo).toHaveBeenCalledWith('/budgetplan/fixedcost');
  });
});
