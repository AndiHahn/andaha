import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { ExpenseApiService } from 'src/app/api/shopping/expense-api.service';
import { ContextService } from 'src/app/core/context.service';
import { BillContextService } from './bill-context.service';
import { ExpenseContextService } from './expense-context.service';

describe('ExpenseContextService downloadExpenses', () => {
  let timeRange: Subject<TimeRangeDto>;
  let exportCalls: number;
  let service: ExpenseContextService;

  const range = (day: number): TimeRangeDto => ({
    startTimeUtc: new Date(2024, 0, 1),
    endTimeUtc: new Date(2024, 0, day)
  });

  beforeEach(() => {
    timeRange = new Subject<TimeRangeDto>();
    exportCalls = 0;

    const api = {
      getAvailableTimeRange: () => timeRange.asObservable(),
      exportExpenses: () => { exportCalls++; return of({ body: null, headers: undefined } as any); }
    } as unknown as ExpenseApiService;

    TestBed.configureTestingModule({
      providers: [
        { provide: BillContextService, useValue: { bills: () => new Subject<any[]>().asObservable() } },
        { provide: ContextService, useValue: { backendReady: () => of(false) } },
        { provide: ExpenseApiService, useValue: api },
        { provide: DatePipe, useValue: new DatePipe('en-US') }
      ]
    });
    service = TestBed.runInInjectionContext(() => new ExpenseContextService());
  });

  it('emits even when the result is produced synchronously', () => {
    // no time range loaded yet -> result is produced synchronously inside downloadExpenses()
    const result = service.downloadExpenses();
    let emissions = 0;

    result.subscribe(() => emissions++);

    expect(emissions).toBe(1);
    expect(exportCalls).toBe(0);
  });

  it('downloads only once even if the time range changes later', () => {
    timeRange.next(range(10));
    let emissions = 0;

    service.downloadExpenses().subscribe(() => emissions++);
    expect(exportCalls).toBe(1);
    expect(emissions).toBe(1);

    timeRange.next(range(20));
    timeRange.next(range(30));

    expect(exportCalls).toBe(1);
  });
});
