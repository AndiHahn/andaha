import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { filterLineItems, lineItemsSum, sumDeviates } from '../../../functions/line-items';

/** Ab dieser Anzahl Positionen erscheint das Suchfeld */
const FILTER_FROM_ITEMS = 8;

/** Positionen einer Rechnung, nur lesend: Menge × Einzelpreis, Summe, Abweichungshinweis, Suche */
@Component({
  selector: 'app-line-items-view',
  templateUrl: './line-items-view.component.html',
  styleUrls: ['./line-items-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe]
})
export class LineItemsViewComponent {
  readonly items = input<BillLineItemDto[]>([]);
  readonly price = input<number>(0);
  readonly initialQuery = input<string>('');

  protected readonly query = linkedSignal(() => this.initialQuery());

  protected readonly showFilter = computed(() => this.items().length >= FILTER_FROM_ITEMS);
  protected readonly rows = computed(() => filterLineItems(this.items(), this.query()));
  protected readonly sum = computed(() => lineItemsSum(this.items()));
  protected readonly deviates = computed(() => sumDeviates(this.items(), this.price()));
}
