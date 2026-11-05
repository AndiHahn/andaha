import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { ContextService } from 'src/app/core/context.service';
import { StatisticsContextService } from './statistics-context.service';

describe('StatisticsContextService error state', () => {
  function createService(api: Partial<StatisticsApiService>, backendReady: boolean): StatisticsContextService {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(backendReady), retryWakeUp: vi.fn() } },
        { provide: StatisticsApiService, useValue: api }
      ]
    });
    return TestBed.runInInjectionContext(() => new StatisticsContextService());
  }

  it('time range fails → error() true, retry() refetches', async () => {
    const range: TimeRangeDto = { startTimeUtc: new Date(2026, 0, 1), endTimeUtc: new Date(2026, 10, 5) };
    let fail = true;
    let timeRangeCalls = 0;
    const service = createService({
      getAvailableTimeRange: () => { timeRangeCalls++; return fail ? throwError(() => new Error('500')) : of(range); }
    }, true);
    expect(service.error()).toBe(true);
    expect(await firstValueFrom(service.loading())).toBe(false);

    fail = false;
    const callsBefore = timeRangeCalls;
    service.retry();

    expect(timeRangeCalls).toBe(callsBefore + 1);
    expect(service.error()).toBe(false);
    expect(await firstValueFrom(service.availableTimeRange())).toEqual(range);
  });

  it('a time range failure before the backend is ready is no error', () => {
    const service = createService({ getAvailableTimeRange: () => throwError(() => new Error('not ready')) }, false);

    expect(service.error()).toBe(false);
  });
});
