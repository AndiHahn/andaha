import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeContextService } from '../../services/income-context.service';
import { IncomeComponent } from './income.component';

describe('IncomeComponent', () => {
  it('shows "Keine Einkommen." when there are none', () => {
    const incomes$ = new BehaviorSubject<IncomeDto[] | undefined>([]);
    TestBed.configureTestingModule({
      imports: [IncomeComponent],
      providers: [
        provideRouter([]),
        { provide: IncomeContextService, useValue: { incomes: () => incomes$.asObservable(), error: signal(false), retry: vi.fn() } }
      ]
    });
    const fixture = TestBed.createComponent(IncomeComponent);

    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Keine Einkommen.');
  });
});
