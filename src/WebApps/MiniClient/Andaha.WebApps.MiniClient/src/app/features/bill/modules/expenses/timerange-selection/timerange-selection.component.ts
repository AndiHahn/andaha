import { Component, OnInit, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker } from '@angular/material/datepicker';
import moment from 'moment';
import { TimeRange } from '../../../../../shared/models/TimeRange';
import { DATE_TYPE_SEGMENT_LABELS, DateType } from './DateType';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

const MONTH_FORMAT = 'YYYY-MM';
const DAY_FORMAT = 'YYYY-MM-DD';

/**
 * Zeitraumwahl der Statistiken (design.md 3.2): Segment Monat | Jahr | Gesamt | Von – Bis,
 * bei Monat und Jahr ‹ › zum Blättern, an den Grenzen von `availableTimeRange` deaktiviert.
 * Der Zustand liegt in Signals; Formwerte werden nie in ngOnChanges gesetzt (vorher NG0100).
 */
@Component({
    selector: 'app-timerange-selection',
    templateUrl: './timerange-selection.component.html',
    styleUrls: ['./timerange-selection.component.scss'],
    providers: GERMAN_DATE_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, FormsModule, ReactiveFormsModule, MatIcon, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker]
})
export class TimerangeSelectionComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);

  readonly availableTimeRange = input.required<TimeRange>();

  readonly selectionChanged = output<TimeRange>();

  readonly dateType = DateType;
  readonly dateTypeOptions = Object.values(DateType);
  readonly dateTypeSegmentLabels = DATE_TYPE_SEGMENT_LABELS;

  readonly selectedDateType = signal<DateType>(DateType.Month);

  /** gewählter Monat ("YYYY-MM") bzw. Jahr; ohne Wahl der letzte verfügbare */
  private readonly selectedMonth = signal<string | undefined>(undefined);
  private readonly selectedYear = signal<number | undefined>(undefined);

  private readonly firstMonth = computed(() => moment(this.availableTimeRange().startDate).format(MONTH_FORMAT));
  private readonly lastMonth = computed(() => moment(this.availableTimeRange().endDate).format(MONTH_FORMAT));
  private readonly firstYear = computed(() => yearOf(this.firstMonth()));
  private readonly lastYear = computed(() => yearOf(this.lastMonth()));

  readonly currentMonth = computed(() => clamp(this.selectedMonth() ?? this.lastMonth(), this.firstMonth(), this.lastMonth()));
  readonly currentYear = computed(() => clamp(this.selectedYear() ?? this.lastYear(), this.firstYear(), this.lastYear()));

  readonly hasArrows = computed(() => this.selectedDateType() === DateType.Month || this.selectedDateType() === DateType.Year);

  readonly canGoBack = computed(() => this.selectedDateType() === DateType.Month
    ? this.currentMonth() > this.firstMonth()
    : this.currentYear() > this.firstYear());

  readonly canGoForward = computed(() => this.selectedDateType() === DateType.Month
    ? this.currentMonth() < this.lastMonth()
    : this.currentYear() < this.lastYear());

  /** „November 2026“ bzw. „2026“ */
  readonly periodLabel = computed(() => this.selectedDateType() === DateType.Month
    ? formatDate(moment(this.currentMonth(), MONTH_FORMAT).toDate(), 'LLLL yyyy', 'de')
    : String(this.currentYear()));

  readonly form: UntypedFormGroup = this.fb.group({
    fromDate: moment(),
    toDate: moment()
  });

  ngOnInit(): void {
    this.emitSelection();
  }

  selectDateType(dateType: DateType): void {
    if (dateType === this.selectedDateType()) {
      return;
    }

    // Wechsel Monat → Jahr: das Jahr des gewählten Monats
    if (dateType === DateType.Year && this.selectedDateType() === DateType.Month) {
      this.selectedYear.set(yearOf(this.currentMonth()));
    }

    this.selectedDateType.set(dateType);
    this.emitSelection();
  }

  previous(): void {
    if (this.canGoBack()) {
      this.step(-1);
    }
  }

  next(): void {
    if (this.canGoForward()) {
      this.step(1);
    }
  }

  customDateChanged(): void {
    this.emitSelection();
  }

  private step(delta: number): void {
    if (this.selectedDateType() === DateType.Month) {
      this.selectedMonth.set(moment(this.currentMonth(), MONTH_FORMAT).add(delta, 'month').format(MONTH_FORMAT));
    } else {
      this.selectedYear.set(this.currentYear() + delta);
    }

    this.emitSelection();
  }

  private emitSelection(): void {
    const dateType = this.selectedDateType();

    // gemeldeten Zeitraum festhalten: ein später erweiterter verfügbarer Zeitraum ändert die Anzeige nicht
    this.selectedMonth.set(this.currentMonth());
    this.selectedYear.set(this.currentYear());

    if (dateType === DateType.Month) {
      const month = moment(this.currentMonth(), MONTH_FORMAT);
      this.selectionChanged.emit(this.createTimeRange(
        month.clone().startOf('month').format(DAY_FORMAT), month.clone().endOf('month').format(DAY_FORMAT), dateType));
    } else if (dateType === DateType.Year) {
      const year = moment(String(this.currentYear()), 'YYYY');
      this.selectionChanged.emit(this.createTimeRange(
        year.clone().startOf('year').format(DAY_FORMAT), year.clone().endOf('year').format(DAY_FORMAT), dateType));
    } else if (dateType === DateType.Total) {
      const available = this.availableTimeRange();
      this.selectionChanged.emit(this.createTimeRange(
        moment(available.startDate).format(DAY_FORMAT), moment(available.endDate).format(DAY_FORMAT), dateType));
    } else {
      const from = this.form.get('fromDate')?.value;
      const to = this.form.get('toDate')?.value;
      if (from && to) {
        this.selectionChanged.emit(this.createTimeRangeWithDate(moment(from).toDate(), moment(to).toDate(), dateType));
      }
    }
  }

  // Ausgabe wie bisher: Tage als "YYYY-MM-DD" geparst
  private createTimeRange(from: string, to: string, dateType: DateType): TimeRange {
    return {
      startDate: new Date(from),
      endDate: new Date(to),
      dateType: dateType
    };
  }

  private createTimeRangeWithDate(from: Date, to: Date, dateType: DateType): TimeRange {
    return {
      startDate: new Date(from),
      endDate: new Date(to),
      dateType: dateType
    };
  }
}

function yearOf(month: string): number {
  return Number(month.slice(0, 4));
}

function clamp<T extends string | number>(value: T, min: T, max: T): T {
  if (value < min) {
    return min;
  }
  return value > max ? max : value;
}
