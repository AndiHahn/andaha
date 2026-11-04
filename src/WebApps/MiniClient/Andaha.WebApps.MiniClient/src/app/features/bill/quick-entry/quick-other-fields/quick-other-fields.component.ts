import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

/**
 * „Andere …“ im Schnell-Sheet (v2 d, AC13): Shopname mit Vorschlägen aus bisherigen Shops, Kategorie,
 * Unterkategorie und der Schalter „Als Vorlage merken“.
 */
@Component({
  selector: 'app-quick-other-fields',
  templateUrl: './quick-other-fields.component.html',
  styleUrls: ['./quick-other-fields.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PanelBackDirective, MatIcon, MatSelect, MatOption, MatAutocompleteTrigger]
})
export class QuickOtherFieldsComponent {
  @Input() categories: CategoryDto[] = [];
  @Input() category: CategoryDto | null = null;
  @Input() subCategoryId: string | null = null;
  @Input() query = '';
  @Input() saveAsTemplate = false;
  @Input({ required: true }) autocomplete!: MatAutocomplete;

  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly inputFocus = new EventEmitter<void>();
  @Output() readonly categoryChange = new EventEmitter<string | null>();
  @Output() readonly subCategoryChange = new EventEmitter<string | null>();
  @Output() readonly saveAsTemplateChange = new EventEmitter<boolean>();

  onInput(event: Event): void {
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }
}
