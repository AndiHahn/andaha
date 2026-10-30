import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeHistoryDialogComponent } from './income-history-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    IncomeHistoryDialogComponent
  ],
  imports: [
    CommonModule,
    DialogModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ]
})
export class IncomeHistoryDialogModule { }
