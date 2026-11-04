import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateIncomeComponent } from './create-income.component';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

const routes: Routes = [
  {
    path: '',
    component: CreateIncomeComponent
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        AppSnackbarModule,
        MatSnackBarModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ShowErrorModule,
        CreateIncomeComponent
    ]
})
export class CreateIncomeModule { }
