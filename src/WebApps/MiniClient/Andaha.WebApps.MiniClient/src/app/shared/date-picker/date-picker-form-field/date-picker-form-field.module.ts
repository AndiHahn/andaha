import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePickerFormFieldComponent } from './date-picker-form-field.component';
import { MatIconModule } from '@angular/material/icon';
import { ShowErrorModule } from '../../form-field/show-error.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DatePickerFormFieldComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    ShowErrorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DatePickerFormFieldComponent
  ]
})
export class DatePickerFormFieldModule { }
