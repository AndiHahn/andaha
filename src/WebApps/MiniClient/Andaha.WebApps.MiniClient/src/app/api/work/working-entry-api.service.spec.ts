import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';
import { WorkingEntryMonthsDto } from './dtos/WorkingEntryMonthsDto';
import { WorkingEntryApiService } from './working-entry-api.service';

describe('WorkingEntryApiService listWorkingEntryMonths', () => {
  let http: HttpTestingController;
  let api: WorkingEntryApiService;

  const isMonths = (r: { method: string; url: string }) =>
    r.method === 'GET' && new URL(r.url).pathname === '/api/working-entry/p1/months';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(WorkingEntryApiService);
  });

  afterEach(() => http.verify());

  it('sends until, months and the device time zone and maps the entries', () => {
    let result: WorkingEntryMonthsDto | undefined;
    api.listWorkingEntryMonths('p1', '2026-10', 2).subscribe(r => result = r);

    const req = http.expectOne(isMonths);
    expect(req.request.params.get('until')).toBe('2026-10');
    expect(req.request.params.get('months')).toBe('2');
    expect(req.request.params.get('tz')).toBe(currentTimeZone());
    req.flush({
      entries: [{ id: 'e1', from: '2026-10-01T06:00:00Z', until: '2026-10-01T14:00:00Z', break: '00:30:00' }],
      nextUntil: '2026-08'
    });

    expect(result!.entries[0].from).toEqual(new Date('2026-10-01T06:00:00Z'));
    expect(result!.entries[0].break).toEqual({ hours: 0, minutes: 30 });
    expect(result!.nextUntil).toBe('2026-08');
  });

  it('without until starts at the newest entry with 3 months', () => {
    api.listWorkingEntryMonths('p1').subscribe();

    const req = http.expectOne(isMonths);
    expect(req.request.params.has('until')).toBe(false);
    expect(req.request.params.get('months')).toBe('3');
    req.flush({ entries: [], nextUntil: null });
  });
});
