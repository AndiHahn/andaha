import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export interface ScanOverlayData {
  /** Verkleinertes Foto, das gerade analysiert wird */
  image: File;
}

/**
 * Vollbild-Ladezustand des Scans (design.md §5.1): Foto-Vorschau, „Rechnung wird gelesen …“ und
 * „Abbrechen“. Wird als Dialog geöffnet (ScanService); Schließen gleich welcher Art bricht ab.
 */
@Component({
  selector: 'app-scan-overlay',
  templateUrl: './scan-overlay.component.html',
  styleUrls: ['./scan-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogClose, MatProgressSpinner]
})
export class ScanOverlayComponent {
  readonly previewUrl: string;

  constructor() {
    const data = inject<ScanOverlayData>(MAT_DIALOG_DATA);
    const url = URL.createObjectURL(data.image);
    this.previewUrl = url;
    inject(DestroyRef).onDestroy(() => URL.revokeObjectURL(url));
  }
}
