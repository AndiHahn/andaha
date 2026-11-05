import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of } from 'rxjs';
import { FullStatisticsDto } from 'src/app/api/work/dtos/FullStatisticsDto';
import { StatisticsDto } from 'src/app/api/work/dtos/StatisticsDto';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { ContextService } from 'src/app/core/context.service';
import { DateType } from 'src/app/features/bill/modules/expenses/timerange-selection/DateType';
import { TimeRange } from 'src/app/shared/models/TimeRange';
import { StatisticsContextService } from './statistics-context.service';

describe('StatisticsContextService load', () => {
  const stats: StatisticsDto = { totalWorkingTime: { hours: 5, minutes: 0 }, extrapolatedMoneyToPay: 100 };
  const full: FullStatisticsDto = {
    totalWorkingTime: { hours: 9, minutes: 0 }, notPayedHours: { hours: 1, minutes: 0 }, payedMoney: 10, notPayedMoney: 5
  };
  const month: TimeRange = { startDate: new Date(2026, 9, 1), endDate: new Date(2026, 9, 31), dateType: DateType.Month };
  const total: TimeRange = { startDate: new Date(2026, 0, 1), endDate: new Date(2026, 10, 5), dateType: DateType.Total };

  function createService(api: Partial<StatisticsApiService>): StatisticsContextService {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContextService, useValue: { backendReady: () => of(false), retryWakeUp: vi.fn() } },
        { provide: StatisticsApiService, useValue: { getAvailableTimeRange: () => new Subject(), ...api } }
      ]
    });
    return TestBed.runInInjectionContext(() => new StatisticsContextService());
  }

  it('clears previous values on range change', async () => {
    const pending = new Subject<StatisticsDto>();
    const responses = [of(stats), pending];
    const service = createService({ getStatistics: vi.fn(() => responses.shift()!) });

    service.load(month, []);
    expect(await firstValueFrom(service.statistics())).toEqual(stats);

    service.load({ ...month, startDate: new Date(2026, 8, 1) }, []);
    expect(await firstValueFrom(service.statistics())).toBeUndefined();
    expect(await firstValueFrom(service.loading())).toBe(true);
  });

  it('passes the person filter and loads full statistics for Gesamt', async () => {
    const getStatistics = vi.fn(() => of(stats));
    const getFullStatistics = vi.fn(() => of(full));
    const service = createService({ getStatistics, getFullStatistics });

    service.load(month, ['p1']);
    service.load(total, ['p1']);

    expect(getStatistics).toHaveBeenCalledWith(month.startDate, month.endDate, ['p1']);
    expect(getFullStatistics).toHaveBeenCalledWith(['p1']);
    expect(await firstValueFrom(service.fullStatistics())).toEqual(full);
    expect(await firstValueFrom(service.statistics())).toBeUndefined();
  });

  it('ignores a superseded response', async () => {
    const slow = new Subject<StatisticsDto>();
    const fast: StatisticsDto = { ...stats, extrapolatedMoneyToPay: 7 };
    const responses = [slow, of(fast)];
    const service = createService({ getStatistics: vi.fn(() => responses.shift()!) });

    service.load(month, ['p1']);
    service.load(month, ['p2']);
    slow.next(stats);

    expect(await firstValueFrom(service.statistics())).toEqual(fast);
  });
});
