import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkEntryDetailsDialogComponent } from './work-entry-details-dialog.component';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { DatePickerFormFieldModule } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.module';
import { TimePickerFormFieldModule } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.module';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';

const routes: Routes = [
  {
    path: '',
    component: WorkEntryDetailsDialogComponent
  }
];

@NgModule({
  declarations: [
    WorkEntryDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatIconModule,
    DatePickerFormFieldModule,
    TimePickerFormFieldModule,
    MatDialogModule,
    DialogModule
  ]
})
export class WorkEntryDetailsDialogModule { }
