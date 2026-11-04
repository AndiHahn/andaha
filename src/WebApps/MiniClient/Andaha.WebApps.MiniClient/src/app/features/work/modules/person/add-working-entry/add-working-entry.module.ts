import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddWorkingEntryComponent } from './add-working-entry.component';
import { RouterModule, Routes } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { TimePickerFormFieldModule } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


const routes: Routes = [
  {
    path: '',
    component: AddWorkingEntryComponent
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatIconModule,
    TimePickerFormFieldModule,
    MatProgressSpinnerModule,
    AddWorkingEntryComponent
]
})
export class AddWorkingEntryModule { }
