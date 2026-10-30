import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDetailsDialogComponent } from './chart-details-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
    ChartDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    DialogModule,
    MatDialogModule
  ],
  exports: [
    ChartDetailsDialogComponent
  ]
})
export class ChartDetailsDialogModule { }
