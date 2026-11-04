import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LongPressDirective } from 'src/app/shared/directives/long-press.directive';
import { QuickTile } from '../logic/tiles';

export interface SuggestionPress {
  tile: QuickTile;
  element: HTMLElement;
}

/**
 * Kacheln des Schnell-Sheets (v2 „Schnell-Sheet“): Vorlagen und Vorschläge als `radiogroup` im
 * 2-Spalten-Raster, darunter „Andere …“ über die volle Breite. Langer Druck auf einen Vorschlag
 * meldet `suggestionPress` (Kontextmenü, AC21).
 */
@Component({
  selector: 'app-quick-tiles',
  templateUrl: './quick-tiles.component.html',
  styleUrls: ['./quick-tiles.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, LongPressDirective]
})
export class QuickTilesComponent {
  @Input({ required: true }) tiles: QuickTile[] = [];
  @Input() selectedKey: string | null = null;

  @Output() readonly selectTile = new EventEmitter<QuickTile>();
  @Output() readonly selectOther = new EventEmitter<void>();
  @Output() readonly suggestionPress = new EventEmitter<SuggestionPress>();

  onLongPress(tile: QuickTile, element: HTMLElement): void {
    if (tile.kind === 'suggestion') {
      this.suggestionPress.emit({ tile, element });
    }
  }
}
