import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule, Routes } from '@angular/router';


import { AnalyzedBillDetailsComponent } from './analyzed-bill-details.component';

const routes: Routes = [
  {
    path: '',
    component: AnalyzedBillDetailsComponent
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressBarModule,
    MatSnackBarModule,
    AnalyzedBillDetailsComponent
]
})
export class AnalyzedBillDetailsModule { }
