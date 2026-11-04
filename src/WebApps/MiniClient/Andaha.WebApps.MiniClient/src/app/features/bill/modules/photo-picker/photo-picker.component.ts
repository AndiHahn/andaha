import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { compressImage } from 'src/app/shared/utils/image-utils';

/**
 * Rechnungsfoto über die native Kamera bzw. Galerie (AC28): zwei Knöpfe, je ein verstecktes
 * `input type="file"`. Das Foto wird vor der Ausgabe verkleinert (AC29); währenddessen sind die
 * Knöpfe gesperrt.
 */
@Component({
  selector: 'app-photo-picker',
  templateUrl: './photo-picker.component.html',
  styleUrls: ['./photo-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, MatProgressSpinner]
})
export class PhotoPickerComponent {
  /** Gewähltes Foto (Vorschau) */
  readonly photo = input<File | null>(null);
  readonly disabled = input(false);

  readonly photoSelected = output<File>();
  readonly photoRemoved = output<void>();

  readonly busy = signal(false);
  readonly previewUrl = signal<string | null>(null);

  private readonly snackbar = inject(MatSnackBar);

  constructor() {
    effect(onCleanup => {
      const photo = this.photo();
      if (!photo) {
        this.previewUrl.set(null);
        return;
      }
      const url = URL.createObjectURL(photo);
      this.previewUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  async onChoose(fileInput: HTMLInputElement): Promise<void> {
    const file = fileInput.files?.[0];
    // gleiche Datei erneut wählbar machen
    fileInput.value = '';
    if (!file || this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      const compressed = await compressImage(file);
      // nicht dekodierbar (kein Bild, Format ohne Browser-Unterstützung): compressImage gibt die Datei unverändert zurück
      if (compressed.type !== 'image/jpeg') {
        openErrorSnackbar('Das Foto konnte nicht gelesen werden.', this.snackbar);
        return;
      }
      this.photoSelected.emit(compressed);
    } finally {
      this.busy.set(false);
    }
  }
}
