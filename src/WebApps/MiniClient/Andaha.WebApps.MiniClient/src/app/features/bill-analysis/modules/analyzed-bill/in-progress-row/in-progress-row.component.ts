import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { LocalUploadState } from '../../../services/analysis-upload.service';

/** Ab dieser Dauer bekommt „Wird analysiert …“ den Zusatz „dauert länger als üblich“ (design.md §4) */
export const LONG_ANALYSIS_MS = 2 * 60_000;

/** Eintrag unter „In Arbeit“: lokaler Upload oder Server-`pending` ohne lokalen Upload (anderes Gerät, Neuladen) */
export interface InProgressItem {
  /** `localId` bzw. die Server-ID */
  key: string;
  /** nur bei lokalen Uploads: für „Erneut versuchen“ und „Entfernen“ */
  localId?: string;
  /** Vorschaubild, nur bei lokal bekannten Bildern */
  previewUrl?: string;
  state: LocalUploadState;
  /** Upload-Fortschritt in Prozent */
  progress: number;
  /** hochgeladen um (Server-`uploadedAt`), Grundlage für „dauert länger als üblich“ */
  since?: Date;
}

@Component({
  selector: 'app-in-progress-row',
  templateUrl: './in-progress-row.component.html',
  styleUrls: ['./in-progress-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, MatProgressBar]
})
export class InProgressRowComponent {
  readonly item = input.required<InProgressItem>();
  /** aktuelle Zeit (tickt in der Seite), damit „dauert länger als üblich“ ohne Abfrage erscheint */
  readonly now = input.required<number>();

  readonly retry = output<void>();
  readonly remove = output<void>();

  readonly takesLonger = computed(() => {
    const since = this.item().since;
    return this.item().state === 'analyzing' && since !== undefined && this.now() - since.getTime() >= LONG_ANALYSIS_MS;
  });
}
