import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeRange } from 'src/app/shared/models/TimeRange';
import { DateType } from './DateType';
import { TimerangeSelectionComponent } from './timerange-selection.component';

describe('TimerangeSelectionComponent', () => {
  let fixture: ComponentFixture<TimerangeSelectionComponent>;
  let host: HTMLElement;
  let emitted: TimeRange[];

  const available: TimeRange = { startDate: new Date(2025, 0, 15), endDate: new Date(2026, 10, 20) };

  const ymd = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const last = () => emitted[emitted.length - 1];
  const prevButton = () => host.querySelector<HTMLButtonElement>('button[aria-label="Vorheriger Zeitraum"]');
  const nextButton = () => host.querySelector<HTMLButtonElement>('button[aria-label="Nächster Zeitraum"]');
  const label = () => host.querySelector('.period-label')?.textContent?.trim();

  function selectDateType(label: string): void {
    const input = Array.from(host.querySelectorAll<HTMLLabelElement>('.segment label'))
      .find(l => l.textContent?.trim() === label)!.querySelector('input')!;
    input.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TimerangeSelectionComponent] });
    fixture = TestBed.createComponent(TimerangeSelectionComponent);
    host = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.selectionChanged.subscribe(range => emitted.push(range));
    fixture.componentRef.setInput('availableTimeRange', available);
    fixture.detectChanges();
  });

  it('starts with the last available month', () => {
    expect(label()).toBe('November 2026');
    expect(emitted.length).toBe(1);
    expect(last().dateType).toBe(DateType.Month);
    expect(ymd(last().startDate)).toBe('2026-11-1');
    expect(ymd(last().endDate)).toBe('2026-11-30');
  });

  it('arrows step month', () => {
    prevButton()!.click();
    fixture.detectChanges();

    expect(label()).toBe('Oktober 2026');
    expect(ymd(last().startDate)).toBe('2026-10-1');
    expect(ymd(last().endDate)).toBe('2026-10-31');

    nextButton()!.click();
    fixture.detectChanges();

    expect(label()).toBe('November 2026');
    expect(ymd(last().startDate)).toBe('2026-11-1');
  });

  it('next disabled at last available month', () => {
    expect(nextButton()!.disabled).toBe(true);
    expect(prevButton()!.disabled).toBe(false);
  });

  it('prev disabled at first available month', () => {
    for (let i = 0; i < 22; i++) {
      prevButton()!.click();
      fixture.detectChanges();
    }

    expect(label()).toBe('Januar 2025');
    expect(prevButton()!.disabled).toBe(true);
  });

  it('arrows step year within the available years', () => {
    selectDateType('Jahr');

    expect(label()).toBe('2026');
    expect(last().dateType).toBe(DateType.Year);
    expect(ymd(last().startDate)).toBe('2026-1-1');
    expect(ymd(last().endDate)).toBe('2026-12-31');
    expect(nextButton()!.disabled).toBe(true);

    prevButton()!.click();
    fixture.detectChanges();

    expect(label()).toBe('2025');
    expect(ymd(last().startDate)).toBe('2025-1-1');
    expect(prevButton()!.disabled).toBe(true);
  });

  it('arrows hidden for total', () => {
    selectDateType('Gesamt');

    expect(prevButton()).toBeNull();
    expect(nextButton()).toBeNull();
    expect(last().dateType).toBe(DateType.Total);
  });

  it('keeps the shown month when the available range grows later', () => {
    fixture.componentRef.setInput('availableTimeRange', { startDate: new Date(2024, 5, 1), endDate: new Date(2026, 11, 3) });
    fixture.detectChanges();

    expect(label()).toBe('November 2026');
    expect(emitted.length).toBe(1);
    expect(nextButton()!.disabled).toBe(false);
  });

  it('has no month or year select anymore', () => {
    expect(host.querySelector('mat-select')).toBeNull();
  });
});
