import { NgModule } from '@angular/core';
import { TimePickerFormFieldComponent } from './time-picker-form-field.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';

@NgModule({
  declarations: [
    TimePickerFormFieldComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    NgxMatTimepickerModule.setLocale('de-DE')
  ],
  exports: [
    TimePickerFormFieldComponent
  ]
})
export class TimePickerFormFieldModule { }
