import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { formatPercentChange, percentChange } from '../functions/compare';

export const WITHOUT_SUBCATEGORY = 'ohne Unterkategorie';

export interface CategoryRowChange {
  text: string;
  /** up = mehr Ausgaben (--neg), down = weniger (--pos), sonst neutral */
  direction: 'up' | 'down' | 'flat' | 'new';
}

export interface CategoryRow {
  category: string;
  color: string;
  costs: number;
  /** fehlt ohne Vergleichszeitraum (Gesamt, Benutzerdefiniert) */
  change?: CategoryRowChange;
  subCategories: { name: string; costs: number }[];
}

/**
 * Kategoriezeilen der Statistik (design.md 3.2, Mockup 01 B): Tipp auf die Zeile meldet die Kategorie,
 * der Pfeil rechts klappt die Unterkategorie-Summen auf.
 */
@Component({
  selector: 'app-category-rows',
  templateUrl: './category-rows.component.html',
  styleUrls: ['./category-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, DecimalPipe]
})
export class CategoryRowsComponent {
  readonly expenses = input.required<ExpenseDto[]>();

  /** Ausgaben des Vorzeitraums; `null` heißt kein Vergleich */
  readonly previousExpenses = input<ExpenseDto[] | null>(null);

  readonly categorySelected = output<string>();

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  readonly rows = computed<CategoryRow[]>(() => {
    const previous = this.previousExpenses();

    return [...this.expenses()]
      .sort((a, b) => b.costs - a.costs)
      .map(expense => ({
        category: expense.category,
        color: expense.color || 'var(--dim)',
        costs: expense.costs,
        change: previous ? changeOf(expense, previous) : undefined,
        subCategories: subCategoriesOf(expense)
      }));
  });

  isExpanded(category: string): boolean {
    return this.expanded().has(category);
  }

  toggle(category: string): void {
    const expanded = new Set(this.expanded());
    if (expanded.has(category)) {
      expanded.delete(category);
    } else {
      expanded.add(category);
    }
    this.expanded.set(expanded);
  }
}

function changeOf(expense: ExpenseDto, previous: ExpenseDto[]): CategoryRowChange {
  const previousCosts = previous.find(p => p.category === expense.category)?.costs ?? 0;
  const change = percentChange(expense.costs, previousCosts);

  if (change === null) {
    return { text: 'neu', direction: 'new' };
  }

  return {
    text: formatPercentChange(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  };
}

/** Unterkategorien absteigend, Kosten ohne Unterkategorie als eigene Zeile am Ende */
function subCategoriesOf(expense: ExpenseDto): { name: string; costs: number }[] {
  const subCategories = [...(expense.subCategories ?? [])]
    .sort((a, b) => b.costs - a.costs)
    .map(sub => ({ name: sub.subCategory, costs: sub.costs }));

  const assigned = subCategories.reduce((sum, sub) => sum + sub.costs, 0);
  const remainder = Math.round((expense.costs - assigned) * 100) / 100;

  if (remainder > 0) {
    subCategories.push({ name: WITHOUT_SUBCATEGORY, costs: remainder });
  }

  return subCategories;
}
