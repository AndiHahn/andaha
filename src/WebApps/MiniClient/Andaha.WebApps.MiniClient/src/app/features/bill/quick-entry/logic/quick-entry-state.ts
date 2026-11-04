import { computed, signal } from '@angular/core';
import { AmountKey, appendKey, parseAmount } from './amount-input';
import { QuickTile } from './tiles';

export type QuickEntryMissing = 'amount' | 'template' | 'shop' | 'category';

/** Lokaler Kalendertag als `YYYY-MM-DD` (Entwurf, „Alle Felder“) */
export function toDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export class QuickEntryState {
  readonly amountText = signal('');
  readonly tile = signal<QuickTile | null>(null);
  readonly shopName = signal<string | null>(null);
  readonly date = signal<Date>(new Date());
  readonly keypadOpen = signal(true);

  /** „Andere …“: Shop, Kategorie und Unterkategorie frei statt Kachel */
  readonly other = signal(false);
  private readonly otherCategoryId = signal<string | null>(null);
  private readonly otherSubCategoryId = signal<string | null>(null);

  readonly amount = computed(() => parseAmount(this.amountText()));

  readonly categoryId = computed(() => this.other() ? this.otherCategoryId() : this.tile()?.categoryId ?? null);
  readonly subCategoryId = computed(() => this.other() ? this.otherSubCategoryId() : this.tile()?.subCategoryId ?? null);

  readonly missing = computed<QuickEntryMissing[]>(() => {
    const missing: QuickEntryMissing[] = [];
    if (this.amount() === null) {
      missing.push('amount');
    }
    if (this.other()) {
      if (!this.shopName()) {
        missing.push('shop');
      }
      if (!this.otherCategoryId()) {
        missing.push('category');
      }
    } else if (this.tile() === null) {
      missing.push('template');
    } else if (!this.shopName()) {
      missing.push('shop');
    }
    return missing;
  });

  readonly canSave = computed(() => this.missing().length === 0);

  readonly hint = computed(() => {
    const missing = this.missing();
    if (missing.length === 0) {
      return '';
    }
    if (missing.includes('amount') && missing.includes('template')) {
      return 'Betrag eingeben und Vorlage wählen';
    }
    switch (missing[0]) {
      case 'amount': return 'Betrag eingeben';
      case 'template': return 'Vorlage wählen';
      case 'category': return 'Kategorie wählen';
      default: return 'Shop wählen';
    }
  });

  /** Tippen klappt die Tastatur nie ein: sie bleibt offen, solange der Betrag aktiv ist (v2) */
  pressKey(key: AmountKey): void {
    this.amountText.update(current => appendKey(current, key));
  }

  selectTile(tile: QuickTile): void {
    this.other.set(false);
    this.tile.set(tile);
    this.shopName.set(tile.shopName);
    this.collapseIfComplete();
  }

  selectShop(name: string): void {
    this.shopName.set(name.trim() || null);
    this.collapseIfComplete();
  }

  /** „Andere …“: Felder statt Kacheln; die Tastatur macht Platz für Shopname und Kategorie */
  selectOther(): void {
    this.other.set(true);
    this.tile.set(null);
    this.shopName.set(null);
    this.keypadOpen.set(false);
  }

  selectCategory(categoryId: string | null, subCategoryId: string | null): void {
    this.otherCategoryId.set(categoryId);
    this.otherSubCategoryId.set(categoryId ? subCategoryId : null);
  }

  leaveOther(): void {
    this.other.set(false);
    this.shopName.set(null);
    this.selectCategory(null, null);
    this.keypadOpen.set(true);
  }

  openKeypad(): void {
    this.keypadOpen.set(true);
  }

  reset(): void {
    this.amountText.set('');
    this.tile.set(null);
    this.shopName.set(null);
    this.other.set(false);
    this.selectCategory(null, null);
    this.date.set(new Date());
    this.keypadOpen.set(true);
  }

  /** Auswahl von Kachel bzw. Shop bei schon gültigem Betrag: Tastatur macht Platz */
  private collapseIfComplete(): void {
    if (!this.other() && this.canSave()) {
      this.keypadOpen.set(false);
    }
  }
}
