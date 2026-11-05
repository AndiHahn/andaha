import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { StatisticsDto } from 'src/app/api/work/dtos/StatisticsDto';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { MonthlyBarsComponent } from 'src/app/features/bill/modules/expenses/monthly-bars/monthly-bars.component';
import { PersonContextService } from '../../services/person-context.service';
import { StatisticsContextService } from '../../services/statistics-context.service';
import { StatisticsComponent } from './statistics.component';

describe('StatisticsComponent', () => {
  let fixture: ComponentFixture<StatisticsComponent>;
  let host: HTMLElement;
  let statistics$: BehaviorSubject<StatisticsDto | undefined>;
  let context: { load: ReturnType<typeof vi.fn>; [key: string]: unknown };
  let api: { getMonthlyHours: ReturnType<typeof vi.fn>; getFullStatistics: ReturnType<typeof vi.fn> };
  let personApi: { export: ReturnType<typeof vi.fn> };
  let setAction: ReturnType<typeof vi.fn>;

  const persons = [{ id: 'p1', name: 'Anna' }, { id: 'p2', name: 'Ben' }] as PersonDto[];
  const stats: StatisticsDto = { totalWorkingTime: { hours: 12, minutes: 30 }, extrapolatedMoneyToPay: 1234.5 };
  const hours = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2025, 11 + i, 1);
    return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, hours: 10 + i };
  });

  const text = (selector: string) => host.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const chip = (name: string) => Array.from(host.querySelectorAll<HTMLElement>('.chip')).find(c => c.textContent!.trim() === name)!;

  function create(): void {
    fixture = TestBed.createComponent(StatisticsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  beforeEach(() => {
    statistics$ = new BehaviorSubject<StatisticsDto | undefined>(undefined);
    const range: TimeRangeDto = { startTimeUtc: new Date(2025, 0, 15), endTimeUtc: new Date(2026, 10, 20) };
    context = {
      availableTimeRange: () => new BehaviorSubject<TimeRangeDto | undefined>(range),
      statistics: () => statistics$.asObservable(),
      fullStatistics: () => new BehaviorSubject(undefined),
      loading: () => new BehaviorSubject(false),
      error: signal(false),
      load: vi.fn(() => statistics$.next(stats)),
      retry: vi.fn()
    };
    api = {
      getMonthlyHours: vi.fn(() => of(hours)),
      getFullStatistics: vi.fn(() => of({ totalWorkingTime: { hours: 99, minutes: 0 }, notPayedHours: { hours: 0, minutes: 0 }, payedMoney: 0, notPayedMoney: 0 }))
    };
    personApi = { export: vi.fn() };
    setAction = vi.fn();

    TestBed.configureTestingModule({
      imports: [StatisticsComponent],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } },
        { provide: StatisticsContextService, useValue: context },
        { provide: PersonContextService, useValue: { persons: () => of(persons) } },
        { provide: StatisticsApiService, useValue: api },
        { provide: PersonApiService, useValue: personApi },
        { provide: PageTitleService, useValue: { setAction } }
      ]
    });
  });

  it('person chips filter statistics', () => {
    create();
    expect(context.load).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: expect.any(Date) }), []);

    chip('Anna').click();
    fixture.detectChanges();

    expect(context.load).toHaveBeenLastCalledWith(expect.anything(), ['p1']);
    expect(api.getMonthlyHours).toHaveBeenLastCalledWith('2026-11', 12, ['p1']);
    expect(chip('Anna').classList).toContain('on');
    expect(chip('Alle').classList).not.toContain('on');
  });

  it('amounts formatted with thousands separator', () => {
    create();

    expect(text('.fig:nth-of-type(2) .value')).toBe('1.234,50 €');
  });

  it('clears previous values on range change', () => {
    create();
    context.load.mockImplementation(() => statistics$.next(undefined));

    chip('Ben').click();
    fixture.detectChanges();

    expect(host.querySelector('.fig')).toBeNull();
  });

  it('empty state "Noch keine Arbeitszeiten – erfasse sie unter Personen." with link', () => {
    api.getFullStatistics.mockReturnValue(of({ totalWorkingTime: { hours: 0, minutes: 0 }, notPayedHours: { hours: 0, minutes: 0 }, payedMoney: 0, notPayedMoney: 0 }));
    context.load.mockImplementation(() => statistics$.next({ ...stats, totalWorkingTime: { hours: 0, minutes: 0 } }));
    create();

    expect(text('.empty')).toBe('Noch keine Arbeitszeiten – erfasse sie unter Personen.');
    expect(host.querySelector('a.empty-link')!.getAttribute('href')).toBe('/work/person');
  });

  it('a zero-hours month with hours in other months keeps figures and chart', () => {
    context.load.mockImplementation(() => statistics$.next({ totalWorkingTime: { hours: 0, minutes: 0 }, extrapolatedMoneyToPay: 0 }));
    create();

    expect(host.querySelector('.empty')).toBeNull();
    expect(host.querySelector('a.empty-link')).toBeNull();
    expect(text('.fig:nth-of-type(1) .value')).toBe('00:00 h');
    expect(text('.fig:nth-of-type(2) .value')).toBe('0,00 €');
    expect(host.querySelector('app-monthly-bars')).not.toBeNull();
  });

  it('bars show hours per month', () => {
    create();

    const bars = fixture.debugElement.query(By.directive(MonthlyBarsComponent)).componentInstance as MonthlyBarsComponent;
    expect(bars.chartData().datasets[0].data).toEqual(hours.map(h => h.hours));
    expect(bars.highlighted()).toEqual([...Array(11).fill(false), true]);
  });

  it('export action shares person export', () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { canShare: () => true, share }));
    const blob = new Blob(['x'], { type: 'application/zip' });
    personApi.export.mockReturnValue(of(new HttpResponse({ body: blob, headers: new HttpHeaders({ 'content-disposition': 'attachment; filename=personen.zip' }) })));
    create();

    const action = setAction.mock.calls[0][0];
    expect(action.label).toBe('Exportieren');
    action.run();

    expect(share).toHaveBeenCalledTimes(1);
    const file = share.mock.calls[0][0].files[0] as File;
    expect(file.name).toBe('personen.zip');
    expect(file.type).toBe('application/zip');
    vi.unstubAllGlobals();
  });
});
