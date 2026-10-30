import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { AnalyzedBillImageDialogComponent } from './analyzed-bill-image-dialog.component';

@NgModule({
  declarations: [AnalyzedBillImageDialogComponent],
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule, DialogModule],
  exports: [],
  entryComponents: [AnalyzedBillImageDialogComponent]
})
export class AnalyzedBillImageDialogModule { }
