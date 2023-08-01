import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LT',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-date-picker-form-field',
  templateUrl: './date-picker-form-field.component.html',
  styleUrls: ['./date-picker-form-field.component.scss'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'de-DE'},
    // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
    // `MatMomentDateModule` in your applications root module. We provide it at the component level
    // here, due to limitations of our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_FORMATS
    },
    {
      provide: MAT_DATE_LOCALE, useValue: 'de-DE'
    }
  ],
})
export class DatePickerFormFieldComponent implements OnInit {

  @Input()
  control!: FormControl;

  @Input()
  label!: string;

  
  disabled: boolean = false;
  
  constructor(
  ) { }

  ngOnInit(): void {
  }

}
