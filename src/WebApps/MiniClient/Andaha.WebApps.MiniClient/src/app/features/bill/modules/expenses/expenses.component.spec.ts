import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ExpenseApiService } from 'src/app/api/shopping/expense-api.service';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { MonthlyCostsDto } from 'src/app/api/shopping/dtos/MonthlyCostsDto';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { ExpenseContextService } from 'src/app/features/bill/services/expense-context.service';
import { ExpensesComponent } from './expenses.component';
import { MonthlyBarsComponent } from './monthly-bars/monthly-bars.component';

describe('ExpensesComponent', () => {
  let fixture: ComponentFixture<ExpensesComponent>;
  let host: HTMLElement;
  let expenses$: BehaviorSubject<ExpenseDto[] | undefined>;
  let error: ReturnType<typeof signal<boolean>>;
  let context: Record<string, unknown>;
  let api: { getExpenses: ReturnType<typeof vi.fn>; getMonthlyExpenses: ReturnType<typeof vi.fn> };
  let billContext: Record<string, ReturnType<typeof vi.fn>>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const current: ExpenseDto[] = [
    {
      category: 'Lebensmittel', costs: 80, color: '#3B7D4F',
      subCategories: [{ subCategory: 'Gebäck', costs: 12.5 }, { subCategory: 'Supermarkt', costs: 60 }]
    },
    { category: 'Auto', costs: 32, color: '#2E4FA8', subCategories: [] }
  ];
  const previous: ExpenseDto[] = [{ category: 'Lebensmittel', costs: 100, color: '#3B7D4F', subCategories: [] }];
  const months: MonthlyCostsDto[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2025, 11 + i, 1);
    return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, costs: 50 + i };
  });

  const text = (selector: string) => host.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const rows = () => Array.from(host.querySelectorAll<HTMLElement>('.crow'));
  const row = (name: string) => rows().find(r => r.querySelector('.n')?.textContent?.trim() === name)!;

  function create(): void {
    fixture = TestBed.createComponent(ExpensesComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(() => {
    expenses$ = new BehaviorSubject<ExpenseDto[] | undefined>(undefined);
    error = signal(false);
    const range: TimeRangeDto = { startTimeUtc: new Date(2025, 0, 15), endTimeUtc: new Date(2026, 10, 20) };

    context = {
      availableTimeRange: () => new BehaviorSubject<TimeRangeDto | undefined>(range),
      expenses: () => expenses$.asObservable(),
      loadExpenses: vi.fn(() => expenses$.next(current)),
      loading: signal(false),
      error,
      retry: vi.fn()
    };
    api = {
      getExpenses: vi.fn(() => of(previous)),
      getMonthlyExpenses: vi.fn(() => of(months))
    };
    billContext = {
      setCategoryFilter: vi.fn(),
      setDateFilter: vi.fn(),
      setSearchText: vi.fn(),
      searchBills: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [
        { provide: ExpenseContextService, useValue: context },
        { provide: ExpenseApiService, useValue: api },
        { provide: BillContextService, useValue: billContext }
      ]
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('loads the selected month, the previous month and 12 months up to it', () => {
    create();

    expect(context['loadExpenses']).toHaveBeenCalledTimes(1);
    expect(api.getExpenses).toHaveBeenCalledWith({ startTimeUtc: '10/01/2026', endTimeUtc: '10/31/2026' });
    expect(api.getMonthlyExpenses).toHaveBeenCalledWith('2026-11', 12);
  });

  it('shows +12 % zum Vormonat', () => {
    create();

    expect(host.querySelector('.tot .v')!.textContent!.replace(/\s+/g, '')).toBe('112,00€');
    expect(text('.tot .delta')).toBe('+12 % zum Vormonat');
    expect(host.querySelector('.tot .delta')!.classList).toContain('up');
  });

  it('shows the change per category and „neu“ without previous costs', () => {
    create();

    expect(row('Lebensmittel').querySelector('.d')!.textContent!.trim()).toBe('−20 %');
    expect(row('Lebensmittel').querySelector('.d')!.classList).toContain('down');
    expect(row('Auto').querySelector('.d')!.textContent!.trim()).toBe('neu');
    expect(row('Lebensmittel').querySelector('.a')!.textContent!.trim()).toBe('80,00 €');
  });

  it('bar chart highlights selected month', () => {
    create();

    const bars = fixture.debugElement.query(By.directive(MonthlyBarsComponent)).componentInstance as MonthlyBarsComponent;
    expect(bars.highlighted()).toEqual([...Array(11).fill(false), true]);
    expect(bars.labels()).toEqual(['D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N']);
    expect(host.querySelector('app-monthly-bars canvas')).not.toBeNull();
  });

  it('category tap sets filters and navigates to /bill/list', () => {
    create();

    (row('Lebensmittel').querySelector('.crow-main') as HTMLElement).click();

    expect(billContext['setSearchText']).toHaveBeenCalledWith('');
    expect(billContext['setCategoryFilter']).toHaveBeenCalledWith(['Lebensmittel']);
    expect(billContext['setDateFilter']).toHaveBeenCalledWith(new Date(2026, 10, 1), new Date(2026, 10, 30));
    expect(billContext['searchBills']).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/bill/list']);
  });

  it('expand shows subcategory sums including ohne Unterkategorie', () => {
    create();
    expect(host.querySelector('.sub')).toBeNull();

    (row('Lebensmittel').querySelector('.chev') as HTMLElement).click();
    fixture.detectChanges();

    const lines = Array.from(host.querySelectorAll('.sub > div')).map(l => Array.from(l.children).map(c => c.textContent!.trim()).join(' '));
    expect(lines).toEqual(['Supermarkt 60,00 €', 'Gebäck 12,50 €', 'ohne Unterkategorie 7,50 €']);
    expect(billContext['setCategoryFilter']).not.toHaveBeenCalled();
  });

  it('total and custom show neither comparison nor chart', () => {
    create();

    const totalInput = Array.from(host.querySelectorAll<HTMLLabelElement>('.segment label'))
      .find(l => l.textContent?.trim() === 'Gesamt')!.querySelector('input')!;
    totalInput.click();
    fixture.detectChanges();

    expect(host.querySelector('.tot .delta')).toBeNull();
    expect(host.querySelector('app-monthly-bars')).toBeNull();
    expect(row('Auto').querySelector('.d')).toBeNull();
  });

  it('shows the empty state without expenses', () => {
    context['loadExpenses'] = vi.fn(() => expenses$.next([]));
    create();

    expect(text('app-load-state .empty')).toBe('Keine Ausgaben in diesem Zeitraum – erfasse Rechnungen unter Liste.');
  });

  it('shows the error state when the comparison could not be loaded and retries everything', () => {
    api.getMonthlyExpenses.mockReturnValueOnce(throwError(() => new Error('boom')));
    create();

    expect(host.querySelector('app-load-state .state-retry')).not.toBeNull();

    (host.querySelector('app-load-state .state-retry') as HTMLElement).click();
    fixture.detectChanges();

    expect(context['retry']).toHaveBeenCalled();
    expect(api.getMonthlyExpenses).toHaveBeenCalledTimes(2);
    expect(host.querySelector('app-load-state .state-retry')).toBeNull();
    expect(text('.tot .delta')).toBe('+12 % zum Vormonat');
  });

  it('shows the empty state instead of a spinner for an account without bills', () => {
    context['availableTimeRange'] = () => new BehaviorSubject<TimeRangeDto | null>(null);
    create();

    expect(text('app-load-state .empty')).toBe('Keine Ausgaben in diesem Zeitraum – erfasse Rechnungen unter Liste.');
    expect(host.querySelector('app-timerange-selection')).toBeNull();
    expect(context['loadExpenses']).not.toHaveBeenCalled();
  });

  it('shows the error state when the context failed', () => {
    error.set(true);
    create();

    expect(host.querySelector('app-load-state .state-retry')).not.toBeNull();
  });
});
