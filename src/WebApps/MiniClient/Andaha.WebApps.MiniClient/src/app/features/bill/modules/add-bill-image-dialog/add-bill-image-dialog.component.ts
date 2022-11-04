import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { WebcamImage } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';

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

  public handleImage(webcamImage: WebcamImage): void {
    const imageName = 'capturedImage_' + new Date().toDateString() + '.png';
    const imageBlob = this.dataUriToBlob(webcamImage.imageAsBase64);
    const imageFile = new File([imageBlob], imageName, { type: 'image/png' });
    
    this.image = new ImageSnippet(webcamImage.imageAsDataUrl, imageFile);
  }

  public onChooseFile(imageInput: any) {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();

      reader.addEventListener('load', (event: any) => {
        this.image = new ImageSnippet(event.target.result, file);
      });

      reader.readAsDataURL(file);
    }
  }

  onChooseImageClick() {
    if (!this.image){
      return;
    }

    this.dialogRef.close(this.image);
  }

  private dataUriToBlob(dataUri: string): Blob {
    const byteString = window.atob(dataUri);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([int8Array], { type: 'image/png' });  

    return blob;
 }
}
