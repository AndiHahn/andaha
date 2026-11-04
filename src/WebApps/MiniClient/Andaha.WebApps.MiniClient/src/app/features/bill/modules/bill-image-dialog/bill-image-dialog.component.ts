import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { BillImageDialogData } from './BillImageDialogData';
import { DialogComponent } from '../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { PinchZoomComponent } from '@meddv/ngx-pinch-zoom';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bill-image-dialog',
    templateUrl: './bill-image-dialog.component.html',
    styleUrls: ['./bill-image-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, PinchZoomComponent, MatProgressSpinner, MatProgressBar, MatIcon]
})
export class BillImageDialogComponent {
  private snackbar = inject(MatSnackBar);
  private billApiService = inject(BillApiService);
  private dialogRef = inject<MatDialogRef<BillImageDialogComponent, boolean | undefined>>(MatDialogRef);


  bill: BillDto;

  imageSrc?: string;

  isLoading: boolean = false;
  isDeleting: boolean = false;
  imageWidth: number;

  constructor() {
    const data = inject<BillImageDialogData>(MAT_DIALOG_DATA);

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
