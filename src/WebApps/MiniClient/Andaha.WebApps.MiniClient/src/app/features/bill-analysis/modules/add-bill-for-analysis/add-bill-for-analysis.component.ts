import { Component } from '@angular/core';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';

@Component({
  selector: 'app-add-bill-for-analysis',
  templateUrl: './add-bill-for-analysis.component.html',
  styleUrls: ['./add-bill-for-analysis.component.scss']
})
export class AddBillForAnalysisComponent {
  selectedFile?: File;
  uploading: boolean = false;
  previewUrl?: string;

  constructor(private billApi: BillApiService, private snack: MatSnackBar) {}

  onFileSelected(event: any) {
    const file = event.target.files?.[0] as File | undefined;
    if (file) {
      this.selectedFile = file;
      this.previewUrl = undefined;
      blobToDataUrl(file).then(url => {
        if (this.selectedFile === file) {
          this.previewUrl = url;
        }
      });
    }
  }

  upload() {
    if (!this.selectedFile) { return; }
    this.uploading = true;
    this.billApi.uploadForAnalysis(this.selectedFile).subscribe({
      next: _ => {
        this.uploading = false;
        this.snack.open('Upload erfolgreich', undefined, { duration: 2000 });
      },
      error: _ => {
        this.uploading = false;
        this.snack.open('Upload fehlgeschlagen', undefined, { duration: 2000 });
      }
    });
  }
}
