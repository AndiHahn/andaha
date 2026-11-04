import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { AnalyzedBillImageDialogService } from './analyzed-bill-image-dialog/analyzed-bill-image-dialog.service';

@Component({
    selector: 'app-analyzed-bill-image',
    templateUrl: './analyzed-bill-image.component.html',
    styleUrls: ['./analyzed-bill-image.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager
})
export class AnalyzedBillImageComponent {
  private imageDialogService = inject(AnalyzedBillImageDialogService);


  @Input()
  billId?: string;

  onShowImageClick(): void {
    if (!this.billId) {
      throw new Error('billId is required to show analyzed bill image.');
    }

    this.imageDialogService.openDialog(this.billId);
  }
}
