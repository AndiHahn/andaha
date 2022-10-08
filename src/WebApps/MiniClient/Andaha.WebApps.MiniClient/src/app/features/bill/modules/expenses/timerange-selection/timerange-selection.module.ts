import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerangeSelectionComponent } from './timerange-selection.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    TimerangeSelectionComponent
  ],
  imports: [
    CommonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule
  ],
  exports: [
    TimerangeSelectionComponent
  ]
})
export class TimerangeSelectionModule { }
