import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDetailsDialogComponent } from './chart-details-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    ChartDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    MatDividerModule,
    DialogModule,
    MatDialogModule
  ],
  exports: [
    ChartDetailsDialogComponent
  ]
})
export class ChartDetailsDialogModule { }
