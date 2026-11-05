import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';
import { StatisticsApiService } from './statistics-api.service';

describe('StatisticsApiService', () => {
  let http: HttpTestingController;
  let api: StatisticsApiService;

  const path = (url: string) => new URL(url).pathname;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: DatePipe, useValue: new DatePipe('en-US') }]
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(StatisticsApiService);
  });

  afterEach(() => http.verify());

  it('statistics api sends personFilter', () => {
    api.getStatistics(new Date(2026, 0, 1), new Date(2026, 0, 31), ['p1', 'p2']).subscribe();

    const req = http.expectOne(r => r.method === 'POST');
    expect(req.request.body.personFilter).toEqual(['p1', 'p2']);
  });

  it('getStatistics without filter sends an empty personFilter (all persons)', () => {
    api.getStatistics(new Date(2026, 0, 1), new Date(2026, 0, 31)).subscribe();

    const req = http.expectOne(r => r.method === 'POST');
    expect(req.request.body.personFilter).toEqual([]);
  });

  it('getFullStatistics repeats personFilter as query parameter', () => {
    api.getFullStatistics(['p1', 'p2']).subscribe();

    const req = http.expectOne(r => r.method === 'GET' && path(r.url).endsWith('/work-statistics/full'));
    expect(req.request.params.getAll('personFilter')).toEqual(['p1', 'p2']);
  });

  it('getAvailableTimeRange maps the empty range of an account without entries to null', () => {
    let result: unknown;
    api.getAvailableTimeRange().subscribe(r => result = r);

    http.expectOne(r => r.method === 'GET' && path(r.url).endsWith('/time-range'))
      .flush({ startTimeUtc: '0001-01-01T00:00:00', endTimeUtc: '0001-01-01T00:00:00' });

    expect(result).toBeNull();
  });

  it('getMonthlyHours sends until, months, personFilter and the device time zone', () => {
    let result: unknown;
    api.getMonthlyHours('2026-11', 12, ['p1']).subscribe(r => result = r);

    const req = http.expectOne(r => r.method === 'GET' && path(r.url).endsWith('/work-statistics/monthly'));
    expect(req.request.params.get('until')).toBe('2026-11');
    expect(req.request.params.get('months')).toBe('12');
    expect(req.request.params.getAll('personFilter')).toEqual(['p1']);
    expect(req.request.params.get('tz')).toBe(currentTimeZone());
    req.flush([{ month: '2026-11', hours: 8.5 }]);

    expect(result).toEqual([{ month: '2026-11', hours: 8.5 }]);
  });
});
