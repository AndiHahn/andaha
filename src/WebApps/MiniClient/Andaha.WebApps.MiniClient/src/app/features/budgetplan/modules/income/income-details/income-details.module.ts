import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeDetailsComponent } from './income-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

const routes: Routes = [
  {
    path: '',
    component: IncomeDetailsComponent
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
        MatProgressBarModule,
        ShowErrorModule,
        IncomeDetailsComponent
    ]
})
export class IncomeDetailsModule { }
