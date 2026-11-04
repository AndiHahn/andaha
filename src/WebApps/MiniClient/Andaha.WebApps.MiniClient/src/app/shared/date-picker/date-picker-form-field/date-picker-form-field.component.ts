import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';

@Component({
  selector: 'app-date-picker-form-field',
  templateUrl: './date-picker-form-field.component.html',
  styleUrls: ['./date-picker-form-field.component.scss'],
  providers: GERMAN_DATE_PROVIDERS,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DatePickerFormFieldComponent implements OnInit {

  @Input()
  control!: FormControl;

  @Input()
  label!: string;
  
  constructor(
  ) { }

  ngOnInit(): void {
  }

}
