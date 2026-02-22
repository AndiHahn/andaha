import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyzedBillImageDialogModule } from './analyzed-bill-image-dialog/analyzed-bill-image-dialog.module';
import { AnalyzedBillImageComponent } from './analyzed-bill-image.component';

@NgModule({
  declarations: [AnalyzedBillImageComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AnalyzedBillImageDialogModule
  ],
  exports: [AnalyzedBillImageComponent]
})
export class AnalyzedBillImageModule { }
