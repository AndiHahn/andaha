import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Klasse an <html>, solange das mobile Dock sichtbar ist: Snackbars stehen dann darüber (styles.scss) */
const DOCK_VISIBLE_CLASS = 'quick-dock-visible';

/**
 * Eingabezeile „Neue Rechnung: Betrag“ (v2 „Eingabezeile (Dock)“, AC8). Nur Auslöser, kein Eingabefeld:
 * öffnet die Schnellerfassung ohne Systemtastatur. Mobil fest über der Hauptleiste mit Kamera-Knopf,
 * Desktop als Feld über der Tabelle mit „Scannen“ daneben (v2 04). Beide öffnen die Foto-Auswahl.
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
  /** Foto für den Scan gewählt (Kamera-Knopf mobil, „Scannen“ am Desktop) */
  @Output() readonly scan = new EventEmitter<File>();

  private readonly root = inject(DOCUMENT).documentElement;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.layout === 'mobile') {
      this.root.classList.add(DOCK_VISIBLE_CLASS);
      this.destroyRef.onDestroy(() => this.root.classList.remove(DOCK_VISIBLE_CLASS));
    }
  }

  onPhotoChosen(fileInput: HTMLInputElement): void {
    const file = fileInput.files?.[0];
    // gleiche Datei erneut wählbar machen
    fileInput.value = '';
    if (file) {
      this.scan.emit(file);
    }
  }
}
