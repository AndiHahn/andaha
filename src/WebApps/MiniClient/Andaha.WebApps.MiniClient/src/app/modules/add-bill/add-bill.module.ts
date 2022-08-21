import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddBillComponent } from './add-bill.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker'
import { RouterModule, Routes } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const routes: Routes = [
  {
    path: '',
    component: AddBillComponent
  }
];

@NgModule({
  declarations: [
    AddBillComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    AppSnackbarModule,
    MatSnackBarModule
  ],
  providers: [
    MatDatepickerModule
  ]
})
export class AddBillModule { }
