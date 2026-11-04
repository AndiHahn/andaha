import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeDetailsComponent } from './income-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    IncomeDetailsComponent
]
})
export class IncomeDetailsModule { }
