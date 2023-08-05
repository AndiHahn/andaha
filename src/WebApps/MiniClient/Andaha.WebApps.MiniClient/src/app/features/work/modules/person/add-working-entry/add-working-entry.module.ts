import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddWorkingEntryComponent } from './add-working-entry.component';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { DatePickerFormFieldModule } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.module';
import { TimePickerFormFieldModule } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.module';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

const routes: Routes = [
  {
    path: '',
    component: AddWorkingEntryComponent
  }
];

@NgModule({
  declarations: [
    AddWorkingEntryComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    AppSnackbarModule,
    MatSnackBarModule,
    MatIconModule,
    DatePickerFormFieldModule,
    TimePickerFormFieldModule
  ]
})
export class AddWorkingEntryModule { }
