import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { takeChosenFiles } from 'src/app/shared/utils/file-utils';

/** Klasse an <html>, solange das mobile Dock sichtbar ist: Snackbars stehen dann darüber (styles.scss) */
const DOCK_VISIBLE_CLASS = 'quick-dock-visible';

/**
 * Eingabezeile „Neue Rechnung: Betrag“ (v2 „Eingabezeile (Dock)“, AC8). Nur Auslöser, kein Eingabefeld:
 * öffnet die Schnellerfassung ohne Systemtastatur. Mobil fest über der Hauptleiste mit Kamera-Knopf,
 * Desktop als Feld über der Tabelle mit „Scannen“ daneben (v2 04). Mobil öffnet der Kamera-Knopf direkt die
 * Kamera (ein Foto je Tipp), der Desktop den Dateidialog; die Galerie gibt es im Tab „Scans“.
 */
@Component({
  selector: 'app-quick-entry-dock',
  templateUrl: './quick-entry-dock.component.html',
  styleUrls: ['./quick-entry-dock.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '[class.desktop]': 'layout === "desktop"' },
  imports: [MatIcon]
})
export class QuickEntryDockComponent implements OnInit {
  @Input() layout: 'mobile' | 'desktop' = 'mobile';

  @Output() readonly openEntry = new EventEmitter<void>();
  /** Foto für die Analyse aufgenommen (Kamera-Knopf mobil) bzw. gewählt („Scannen“ am Desktop) */
  @Output() readonly scan = new EventEmitter<File[]>();

  private readonly root = inject(DOCUMENT).documentElement;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.layout === 'mobile') {
      this.root.classList.add(DOCK_VISIBLE_CLASS);
      this.destroyRef.onDestroy(() => this.root.classList.remove(DOCK_VISIBLE_CLASS));
    }
  }

  onPhotoChosen(fileInput: HTMLInputElement): void {
    const files = takeChosenFiles(fileInput);
    if (files.length > 0) {
      this.scan.emit(files);
    }
  }
}
