import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillImageDialogService } from 'src/app/features/bill/modules/bill-image-dialog/bill-image-dialog.service';

/** Beleg-Kachel einer analysierten Rechnung; öffnet das Foto im Pinch-Zoom-Dialog der Rechnungen (AC34) */
@Component({
    selector: 'app-analyzed-bill-image',
    templateUrl: './analyzed-bill-image.component.html',
    styleUrls: ['./analyzed-bill-image.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager
})
export class AnalyzedBillImageComponent {
  private imageDialogService = inject(BillImageDialogService);
  private billApi = inject(BillApiService);

  @Input()
  billId?: string;

  onShowImageClick(): void {
    if (!this.billId) {
      throw new Error('billId is required to show analyzed bill image.');
    }

    // Analyse-Fotos werden mit dem Eintrag verworfen, nicht einzeln gelöscht: kein „Löschen“
    void this.imageDialogService.openDialog({ image: this.billApi.downloadAnalyzedBillImage(this.billId) });
  }
}
