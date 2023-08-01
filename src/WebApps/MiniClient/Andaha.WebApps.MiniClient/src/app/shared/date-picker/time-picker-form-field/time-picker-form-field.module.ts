import { NgModule } from '@angular/core';
import { TimePickerFormFieldComponent } from './time-picker-form-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';

@NgModule({
  declarations: [
    TimePickerFormFieldComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatTimepickerModule.setLocale('de-DE')
  ],
  exports: [
    TimePickerFormFieldComponent
  ]
})
export class TimePickerFormFieldModule { }
