import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';

@Component({
  selector: 'app-analyzed-bill-image-dialog',
  templateUrl: './analyzed-bill-image-dialog.component.html',
  styleUrls: ['./analyzed-bill-image-dialog.component.scss']
})
export class AnalyzedBillImageDialogComponent {
  billId: string;
  imageSrc?: string;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AnalyzedBillImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private billApiService: BillApiService,
    private snackbar: MatSnackBar
  ) {
    this.billId = data.billId;
    this.fetchImage();
  }

  private fetchImage(): void {
    this.isLoading = true;
    this.billApiService.downloadImage(this.billId).subscribe({
      next: async blob => {
        this.imageSrc = await blobToDataUrl(blob);
        this.isLoading = false;
      },
      error: _ => {
        this.isLoading = false;
        openErrorSnackbar('Foto konnte nicht geladen werden.', this.snackbar);
      }
    });
  }
}
