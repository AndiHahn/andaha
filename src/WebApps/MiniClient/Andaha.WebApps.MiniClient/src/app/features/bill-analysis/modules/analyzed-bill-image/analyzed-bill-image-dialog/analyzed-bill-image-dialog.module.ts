import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { AnalyzedBillImageDialogComponent } from './analyzed-bill-image-dialog.component';

@NgModule({
  declarations: [AnalyzedBillImageDialogComponent],
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule, MatButtonModule],
  exports: [],
  entryComponents: [AnalyzedBillImageDialogComponent]
})
export class AnalyzedBillImageDialogModule { }
