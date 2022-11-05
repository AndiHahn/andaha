import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { WebcamImage } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';
import { blobToDataUrl, fileDataUriToBlob, imageBlobToFile } from 'src/app/shared/utils/file-utils';

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
  styleUrls: ['./add-bill-image-dialog.component.scss']
})
export class AddBillImageDialogComponent {

  uploadSelection = UploadSelection;

  selectedOption: UploadSelection = UploadSelection.TakePicture;

  private trigger: Subject<void> = new Subject();

  maxVideoWidth: number;
  maxVideoHeight: number;

  image?: ImageSnippet;

  uploading: boolean = false;

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  constructor(
    private dialogRef: MatDialogRef<AddBillImageDialogComponent, ImageSnippet>
  ) {
    const padding = 24;
    const windowWidth = window.innerWidth;
    this.maxVideoWidth = windowWidth - (2 * padding);

    const windowHeight = window.innerHeight;
    this.maxVideoHeight = windowHeight * 0.6;
  }

  onRadioButtonChange(event: MatRadioChange): void {
    this.selectedOption = event.value;
    this.image = undefined;
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public onCameraClick(): void {
    this.trigger.next();
  }

  public handleImage(webcamImage: WebcamImage): void {
    const imageName = 'capturedImage_' + new Date().toDateString() + '.png';
    const imageBlob = fileDataUriToBlob(webcamImage.imageAsBase64);
    const imageFile = imageBlobToFile(imageBlob, imageName);
    
    this.image = new ImageSnippet(webcamImage.imageAsDataUrl, imageFile);
  }

  public onChooseFile(imageInput: any) {
    const file = imageInput.files[0];
    if (file) {
      blobToDataUrl(file).then(fileDataUrl => {
        if (fileDataUrl) {
          this.image = new ImageSnippet(fileDataUrl, file);
        }
      });
    }
  }

  onChooseImageClick() {
    if (!this.image){
      return;
    }

    this.dialogRef.close(this.image);
  }
}
