import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

/**
 * Shop-Auswahl bei Vorlagen ohne festen Shop (v2 c, AC12): Fläche well, häufigste Shops als Chips,
 * der gewählte mit Häkchen, zuletzt „Anderer …“ mit freiem Feld (Vorschläge aus bisherigen Shops).
 */
@Component({
  selector: 'app-quick-shop-choice',
  templateUrl: './quick-shop-choice.component.html',
  styleUrls: ['./quick-shop-choice.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PanelBackDirective, MatIcon, MatAutocompleteTrigger]
})
export class QuickShopChoiceComponent {
  @Input() shops: string[] = [];
  @Input() selected: string | null = null;
  /** „Anderer …“ ist gewählt: freies Feld statt Chip */
  @Input() custom = false;
  @Input() query = '';
  @Input({ required: true }) autocomplete!: MatAutocomplete;

  @Output() readonly selectShop = new EventEmitter<string>();
  @Output() readonly selectCustom = new EventEmitter<void>();
  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly inputFocus = new EventEmitter<void>();

  onInput(event: Event): void {
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }
}
