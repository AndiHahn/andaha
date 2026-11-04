import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkEntryDetailsDialogComponent } from './work-entry-details-dialog.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

import { TimePickerFormFieldModule } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.module';
import { MatDialogModule } from '@angular/material/dialog';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


const routes: Routes = [
  {
    path: '',
    component: WorkEntryDetailsDialogComponent
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatIconModule,
    TimePickerFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    WorkEntryDetailsDialogComponent
]
})
export class WorkEntryDetailsDialogModule { }
