import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { blobToDataUrl } from 'src/app/shared/utils/file-utils';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';

@Component({
  selector: 'app-add-bill-for-analysis',
  templateUrl: './add-bill-for-analysis.component.html',
  styleUrls: ['./add-bill-for-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
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

  async upload() {
    if (!this.selectedFile) { return; }
    this.uploading = true;
    const compressed = await compressImage(this.selectedFile);
    this.billApi.uploadForAnalysis(compressed).subscribe({
      next: _ => {
        this.uploading = false;
        openInformationSnackbar('Foto wird analysiert. Das Ergebnis erscheint in wenigen Minuten unter Rechnungen oder Analyse.', this.snack, { duration: 6000 });
        this.selectedFile = undefined;
        this.previewUrl = undefined;
      },
      error: _ => {
        this.uploading = false;
        openErrorSnackbar('Foto konnte nicht hochgeladen werden.', this.snack);
      }
    });
  }
}
