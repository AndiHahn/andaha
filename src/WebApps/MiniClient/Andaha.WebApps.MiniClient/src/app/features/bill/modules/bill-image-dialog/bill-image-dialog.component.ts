import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { BillImageDialogData } from './BillImageDialogData';

@Component({
  selector: 'app-bill-image-dialog',
  templateUrl: './bill-image-dialog.component.html',
  styleUrls: ['./bill-image-dialog.component.scss']
})
export class BillImageDialogComponent {

  bill: BillDto;

  imageSrc?: string;

  isLoading: boolean = false;
  isDeleting: boolean = false;
  imageWidth: number;

  constructor(
    private snackbar: MatSnackBar,
    private billApiService: BillApiService,
    private dialogRef: MatDialogRef<BillImageDialogComponent, boolean | undefined>,
    @Inject(MAT_DIALOG_DATA) data: BillImageDialogData
  ) {
    const padding = 24;
    const windowWidth = window.innerWidth;
    this.imageWidth = windowWidth - (2 * padding);

    this.bill = data.bill;

    this.fetchImage();
  }

  onDeleteImageClick(): void {
    this.isDeleting = true;

    this.billApiService.deleteImage(this.bill.id).subscribe(
      {
        next: _ =>{
          this.isDeleting = false;
          this.dialogRef.close(true);
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar('Foto konnte nicht gelöscht werden.', this.snackbar);
        }
      }
    );
  }

  private fetchImage(): void {
    this.isLoading = true;

    this.billApiService.downloadImage(this.bill.id).subscribe(
      {
        next: async blob => {
          this.imageSrc = await blobToDataUrl(blob);
          this.isLoading = false;
        },
        error: _ => {
          this.isLoading = false;
          openErrorSnackbar('Foto konnte nicht geladen werden.', this.snackbar);
        }
      }
    );
  }
}
