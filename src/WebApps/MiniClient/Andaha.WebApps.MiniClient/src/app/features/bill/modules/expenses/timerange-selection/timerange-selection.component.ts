import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TimeRange } from './TimeRange';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { DateType, DateTypeLabelMapping } from './DateType';
import * as moment from 'moment';

@Component({
  selector: 'app-timerange-selection',
  templateUrl: './timerange-selection.component.html',
  styleUrls: ['./timerange-selection.component.scss']
})
export class TimerangeSelectionComponent implements OnInit, OnChanges {

  @Input()
  availableTimeRange!: TimeRange;

  @Output()
  selectionChanged: EventEmitter<TimeRange> = new EventEmitter<TimeRange>();

  form: UntypedFormGroup;
  
  dateTypeLabelMapping = DateTypeLabelMapping;
  dateType = DateType;
  dateTypeOptions = Object.values(DateType);
  selectedDateType: DateType;
  
  monthSelectOptions?: string[];
  currentMonth?: string;

  yearSelectOptions?: string[];
  currentYear?: string;

  customFromDate?: Date;
  customToDate?: Date;

  constructor(
    private fb: UntypedFormBuilder) {
    this.selectedDateType = DateType.Month;

    this.form = this.fb.group({
      dateType: DateType['Month'],
      monthSelection: '',
      yearSelection: '',
      fromDate: new Date(),
      toDate: new Date()
    });
  }

  ngOnInit(): void {
    if (!this.availableTimeRange) {
      throw new Error('An available time range is required in order to use this component');
    }
    
    this.refreshOptions();
    this.triggerSelectionChanged();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const timeRangeChange = changes?.['availableTimeRange'];

    if (timeRangeChange && timeRangeChange.currentValue != timeRangeChange.previousValue) {
      this.refreshOptions();
    }
  }

  refreshOptions() {
    this.refreshMonthSelectOptions();
    this.refreshYearSelectOptions();
    this.refreshCustomDateSelection();
  }

  refreshMonthSelectOptions() {
    let startDate = moment(this.availableTimeRange.startDate);
    let endDate = moment(this.availableTimeRange.endDate);

    const dates = [];
    endDate.subtract(1, "month"); //Substract one month to exclude endDate itself

    const month = moment(startDate); //clone the startDate
    dates.push(month.format('YYYY-MM'));
    while (month < endDate) {
        month.add(1, "month");
        dates.push(month.format('YYYY-MM'));
    }

    if (dates.length > 0) {
      this.form.get('monthSelection')?.setValue(dates[dates.length-1]);
      this.currentMonth = dates[dates.length-1];
    }
    this.monthSelectOptions = dates;
  }

  refreshYearSelectOptions() {
    let startDate = moment(this.availableTimeRange.startDate);
    let endDate = moment(this.availableTimeRange.endDate);

    const dates = [];
    endDate.subtract(1, "year"); //Substract one month to exclude endDate itself

    const year = moment(startDate); //clone the startDate
    dates.push(year.format('YYYY'));
    while (year < endDate) {
      year.add(1, "year");
        dates.push(year.format('YYYY'));
    }

    if (dates.length > 0) {
      this.form.get('yearSelection')?.setValue(dates[0]);
      this.currentYear = dates[0];
    }
    this.yearSelectOptions = dates;
  }

  refreshCustomDateSelection() {
    this.customFromDate = this.form.get('fromDate')?.value;
    this.customToDate = this.form.get('toDate')?.value;
  }
  
  triggerSelectionChanged() {
    if (this.selectedDateType == DateType.Month) {
      const startOfMonth = moment(this.currentMonth).startOf('month').format('YYYY-MM-DD');
      const endOfMonth   = moment(this.currentMonth).endOf('month').format('YYYY-MM-DD');
      this.selectionChanged.emit(this.createTimeRange(startOfMonth, endOfMonth));
    } else if (this.selectedDateType == DateType.Year) {
      const startOfYear = moment(this.currentMonth).startOf('year').format('YYYY-MM-DD');
      const endOfYear   = moment(this.currentMonth).endOf('year').format('YYYY-MM-DD');
      this.selectionChanged.emit(this.createTimeRange(startOfYear, endOfYear));
    } else if (this.selectedDateType == DateType.Custom && this.customFromDate && this.customToDate) {
      this.selectionChanged.emit(this.createTimeRangeWithDate(this.customFromDate, this.customToDate));
    } else {
      throw new Error('Date Type ' + this.selectedDateType + ' is not available');
    }
  }

  createTimeRange(from: string, to: string): TimeRange {
    return {
      startDate: new Date(from),
      endDate: new Date(to)
    };
  }

  createTimeRangeWithDate(from: Date, to: Date): TimeRange {
    return {
      startDate: new Date(from),
      endDate: new Date(to)
    };
  }

  dateTypeSelectionChanged() {
    this.selectedDateType = this.form.get('dateType')?.value;
    this.triggerSelectionChanged();
  }

  monthSelectionChanged() {
    this.currentMonth = this.form.get('monthSelection')?.value;
    this.triggerSelectionChanged();
  }

  yearSelectionChanged() {
    this.currentYear = this.form.get('yearSelection')?.value;
    this.triggerSelectionChanged();
  }

  customFromDateChanged() {
    this.customFromDate = this.form.get('fromDate')?.value;
    this.triggerSelectionChanged();
  }

  customToDateChanged() {
    this.customToDate = this.form.get('toDate')?.value;
    this.triggerSelectionChanged();
  }
}
