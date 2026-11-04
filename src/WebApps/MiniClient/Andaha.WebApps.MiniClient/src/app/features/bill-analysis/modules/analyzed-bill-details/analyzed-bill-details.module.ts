import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule, Routes } from '@angular/router';
import { AnalyzedBillImageModule } from '../analyzed-bill-image/analyzed-bill-image.module';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
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
        AnalyzedBillImageModule,
        MatProgressBarModule,
        MatSnackBarModule,
        AppSnackbarModule,
        AnalyzedBillDetailsComponent
    ]
})
export class AnalyzedBillDetailsModule { }
