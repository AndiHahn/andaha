import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { NgxMatTimepickerDirective, NgxMatTimepickerComponent } from 'ngx-mat-timepicker';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-time-picker-form-field',
    templateUrl: './time-picker-form-field.component.html',
    styleUrls: ['./time-picker-form-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgxMatTimepickerDirective, MatIcon, NgxMatTimepickerComponent]
})
export class TimePickerFormFieldComponent implements OnInit {

  @Input()
  label!: string;

  @Input()
  minutesGap: number = 5;

  @Input()
  defaultTime!: string;

  @Input()
  disabled: boolean = false;

  @Output()
  timeChanged: EventEmitter<string> = new EventEmitter();

  format: number = 24;

  constructor() { }

  ngOnInit(): void {
  }

  ngxTimeSet(time: string): void {
    this.timeChanged.emit(time);
  }
}
