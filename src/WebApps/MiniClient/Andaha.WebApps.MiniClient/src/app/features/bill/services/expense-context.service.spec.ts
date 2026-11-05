import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { ExpenseApiService } from 'src/app/api/shopping/expense-api.service';
import { ContextService } from 'src/app/core/context.service';
import { BillContextService } from './bill-context.service';
import { ExpenseContextService } from './expense-context.service';

describe('ExpenseContextService downloadExpenses', () => {
  let exportExpenses: ReturnType<typeof vi.fn>;
  let service: ExpenseContextService;
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);

  beforeEach(() => {
    exportExpenses = vi.fn(() => of({ body: null, headers: new HttpHeaders() } as unknown as HttpResponse<Blob>));

    const api = {
      getAvailableTimeRange: () => new Subject<TimeRangeDto>().asObservable(),
      exportExpenses
    } as unknown as ExpenseApiService;

    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => new Subject<any[]>().asObservable() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(false) } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    service = TestBed.runInInjectionContext(() => new ExpenseContextService());
  });

  it('requests the given range and category names', () => {
    service.downloadExpenses(start, end, ['Lebensmittel']).subscribe({ error: () => { } });

    expect(exportExpenses).toHaveBeenCalledWith(start, end, ['Lebensmittel']);
  });

  it('errors when the export has no content', () => {
    let failed = false;

    service.downloadExpenses(start, end).subscribe({ error: () => failed = true });

    expect(failed).toBe(true);
  });

  it('propagates api errors', () => {
    exportExpenses.mockReturnValue(throwError(() => new Error('boom')));
    let failed = false;

    service.downloadExpenses(start, end).subscribe({ error: () => failed = true });

    expect(failed).toBe(true);
  });
});

describe('ExpenseContextService error state', () => {
  it('time range fails → error() true, retry() refetches', () => {
    const range = { startTimeUtc: new Date(2026, 0, 1), endTimeUtc: new Date(2026, 10, 5) };
    let fail = true;
    let timeRangeCalls = 0;
    const api = {
      getAvailableTimeRange: () => { timeRangeCalls++; return fail ? throwError(() => new Error('500')) : of(range); }
    } as unknown as ExpenseApiService;

    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => new Subject<any[]>().asObservable() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(true), retryWakeUp: vi.fn() } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    const service = TestBed.runInInjectionContext(() => new ExpenseContextService());
    expect(service.error()).toBe(true);
    expect(service.loading()).toBe(false);

    fail = false;
    const callsBefore = timeRangeCalls;
    let current: TimeRangeDto | null | undefined;
    service.availableTimeRange().subscribe(r => current = r);
    service.retry();

    expect(timeRangeCalls).toBe(callsBefore + 1);
    expect(service.error()).toBe(false);
    expect(current).toEqual(range);
  });

  it('a time range failure before the backend is ready is no error', () => {
    const api = { getAvailableTimeRange: () => throwError(() => new Error('not ready')) } as unknown as ExpenseApiService;
    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => new Subject<any[]>().asObservable() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(false) } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    const service = TestBed.runInInjectionContext(() => new ExpenseContextService());

    expect(service.error()).toBe(false);
  });

  it('an account without bills has the empty range null until its first bill sets the range', () => {
    const bills = new Subject<any[]>();
    const api = { getAvailableTimeRange: () => of(null) } as unknown as ExpenseApiService;
    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => bills.asObservable() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(true) } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    const service = TestBed.runInInjectionContext(() => new ExpenseContextService());
    let current: TimeRangeDto | null | undefined;
    service.availableTimeRange().subscribe(r => current = r);

    expect(current).toBeNull();
    expect(service.error()).toBe(false);

    bills.next([{ date: new Date(2026, 10, 5) }]);

    expect(current).toEqual({ startTimeUtc: new Date(2026, 10, 5), endTimeUtc: new Date(2026, 10, 5) });
  });

  it('a late response of an older time range is ignored (fast ‹ › stepping)', () => {
    const october = new Subject<any[]>();
    const september = new Subject<any[]>();
    const responses = [october, september];
    const api = {
      getAvailableTimeRange: () => of({ startTimeUtc: new Date(2025, 0, 1), endTimeUtc: new Date(2026, 10, 5) }),
      getExpenses: () => responses.shift()!.asObservable()
    } as unknown as ExpenseApiService;
    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => new Subject<any[]>().asObservable() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(true) } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    const service = TestBed.runInInjectionContext(() => new ExpenseContextService());
    let shown: any[] | undefined;
    service.expenses().subscribe(expenses => shown = expenses);

    service.loadExpenses({ startDate: new Date(2026, 9, 1), endDate: new Date(2026, 9, 31) });
    service.loadExpenses({ startDate: new Date(2026, 8, 1), endDate: new Date(2026, 8, 30) });
    september.next([{ category: 'September', costs: 1, subCategories: [] }]);
    october.next([{ category: 'Oktober', costs: 2, subCategories: [] }]);

    expect(shown).toEqual([{ category: 'September', costs: 1, subCategories: [] }]);
    expect(service.loading()).toBe(false);
  });
});
