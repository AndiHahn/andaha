import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixedCostHistoryDialogComponent } from './fixed-cost-history-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    FixedCostHistoryDialogComponent
  ],
  imports: [
    CommonModule,
    DialogModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class FixedCostHistoryDialogModule { }
