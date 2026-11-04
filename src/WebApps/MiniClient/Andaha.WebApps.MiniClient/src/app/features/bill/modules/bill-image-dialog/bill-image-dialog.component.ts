import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private dialogRef = inject<MatDialogRef<BillImageDialogComponent, boolean | undefined>>(MatDialogRef);

  private readonly data = inject<BillImageDialogData>(MAT_DIALOG_DATA);
  /** „Löschen“ nur, wenn das Foto gelöscht werden darf (Rechnung, nicht Analyse) */
  readonly canDelete = !!this.data.delete;

  imageSrc?: string;

  isLoading: boolean = false;
  isDeleting: boolean = false;

  constructor() {
    this.fetchImage();
  }

  onDeleteImageClick(): void {
    if (!this.data.delete) {
      return;
    }
    this.isDeleting = true;

    this.data.delete().subscribe(
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

    this.data.image.subscribe(
      {
        next: async blob => {
          // leeres Foto (z. B. fehlgeschlagene Analyse ohne Bilddaten): kein kaputtes Bild anzeigen
          if (blob.size === 0) {
            this.isLoading = false;
            openErrorSnackbar('Foto konnte nicht geladen werden.', this.snackbar);
            return;
          }
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
