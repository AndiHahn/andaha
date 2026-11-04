import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillImageDialogService } from '../bill-image-dialog/bill-image-dialog.service';
import { BillImageDialogData } from '../bill-image-dialog/BillImageDialogData';
import { MatIcon } from '@angular/material/icon';
import { PhotoPickerComponent } from '../photo-picker/photo-picker.component';

@Component({
    selector: 'app-bill-image',
    templateUrl: './bill-image.component.html',
    styleUrls: ['./bill-image.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon, PhotoPickerComponent]
})
export class BillImageComponent {
  private imageDialogService = inject(BillImageDialogService);
  private billApi = inject(BillApiService);

  @Input()
  bill?: BillDto;

  @Input()
  editing: boolean = false;

  @Input()
  saving: boolean = false;

  /** Neu gewähltes, noch nicht gespeichertes Foto (Vorschau im Bearbeiten-Modus) */
  @Input()
  photo: File | null = null;

  /** Neues Foto gewählt bzw. wieder entfernt (null) */
  @Output()
  imageSelected: EventEmitter<File | null> = new EventEmitter();

  onShowImageClick(): void {
    if (!this.bill) {
      throw new Error("Bill is required to show bill image.");
    }

    const billId = this.bill.id;
    const data: BillImageDialogData = {
      image: this.billApi.downloadImage(billId),
      delete: () => this.billApi.deleteImage(billId)
    };

    this.imageDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: deleted => {
          if (deleted && this.bill) {
            this.bill.imageAvailable = false;
          }
        }
      }
    ));
  }
}
