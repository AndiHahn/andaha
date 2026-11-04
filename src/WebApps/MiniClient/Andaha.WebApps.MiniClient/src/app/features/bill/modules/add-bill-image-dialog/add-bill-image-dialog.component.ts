import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { MatRadioChange, MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { DialogComponent } from '../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatIcon } from '@angular/material/icon';

export class ImageSnippet {
  constructor(public src: string, public file: File) {}
}

enum UploadSelection {
  TakePicture = 'TakePicture',
  UploadFromGallery = 'UploadFromGallery'
}

@Component({
    selector: 'app-add-bill-image-dialog',
    templateUrl: './add-bill-image-dialog.component.html',
    styleUrls: ['./add-bill-image-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, MatRadioGroup, MatRadioButton, MatIcon]
})
export class AddBillImageDialogComponent {
  private dialogRef = inject<MatDialogRef<AddBillImageDialogComponent, ImageSnippet>>(MatDialogRef);


  uploadSelection = UploadSelection;

  selectedOption: UploadSelection = UploadSelection.TakePicture;

  maxPreviewWidth: number;

  image?: ImageSnippet;

  uploading: boolean = false;

  constructor() {
    const padding = 24;
    const windowWidth = window.innerWidth;
    this.maxPreviewWidth = windowWidth - (2 * padding);
  }

  onRadioButtonChange(event: MatRadioChange): void {
    this.selectedOption = event.value;
    this.image = undefined;
  }

  public async onChooseFile(imageInput: HTMLInputElement): Promise<void> {
    const file = imageInput.files?.[0];
    if (!file) {
      return;
    }

    const compressed = await compressImage(file);
    const fileDataUrl = await blobToDataUrl(compressed);
    if (fileDataUrl) {
      this.image = new ImageSnippet(fileDataUrl, compressed);
    }

    // gleiche Datei erneut waehlbar machen
    imageInput.value = '';
  }

  onChooseImageClick() {
    if (!this.image){
      return;
    }

    this.dialogRef.close(this.image);
  }
}
