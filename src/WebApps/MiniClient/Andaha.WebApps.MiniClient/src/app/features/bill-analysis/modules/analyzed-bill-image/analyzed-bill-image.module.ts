import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzedBillImageDialogModule } from './analyzed-bill-image-dialog/analyzed-bill-image-dialog.module';
import { AnalyzedBillImageComponent } from './analyzed-bill-image.component';

@NgModule({
    imports: [
        CommonModule,
        AnalyzedBillImageDialogModule,
        AnalyzedBillImageComponent
    ],
    exports: [AnalyzedBillImageComponent]
})
export class AnalyzedBillImageModule { }
