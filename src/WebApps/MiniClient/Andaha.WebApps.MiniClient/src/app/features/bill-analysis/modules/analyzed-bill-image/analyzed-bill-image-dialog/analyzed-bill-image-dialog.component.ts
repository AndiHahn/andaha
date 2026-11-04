import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-analyzed-bill-image-dialog',
    templateUrl: './analyzed-bill-image-dialog.component.html',
    styleUrls: ['./analyzed-bill-image-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, MatProgressSpinner]
})
export class AnalyzedBillImageDialogComponent {
  private dialogRef = inject<MatDialogRef<AnalyzedBillImageDialogComponent>>(MatDialogRef);
  private billApiService = inject(BillApiService);
  private snackbar = inject(MatSnackBar);

  billId: string;
  imageSrc?: string;
  isLoading: boolean = false;

  constructor() {
    const data = inject(MAT_DIALOG_DATA);

    this.billId = data.billId;
    this.fetchImage();
  }

  private fetchImage(): void {
    this.isLoading = true;
    this.billApiService.downloadAnalyzedBillImage(this.billId).subscribe({
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
