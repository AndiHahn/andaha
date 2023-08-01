import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-time-picker-form-field',
  templateUrl: './time-picker-form-field.component.html',
  styleUrls: ['./time-picker-form-field.component.scss']
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
