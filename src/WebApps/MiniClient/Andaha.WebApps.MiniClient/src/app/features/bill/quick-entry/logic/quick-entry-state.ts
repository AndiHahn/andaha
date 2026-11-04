import { computed, signal } from '@angular/core';
import { AmountKey, appendKey, parseAmount } from './amount-input';
import { QuickTile } from './tiles';

export type QuickEntryMissing = 'amount' | 'template' | 'shop';

export class QuickEntryState {
  readonly amountText = signal('');
  readonly tile = signal<QuickTile | null>(null);
  readonly shopName = signal<string | null>(null);
  readonly date = signal<Date>(new Date());
  readonly keypadOpen = signal(true);

  readonly amount = computed(() => parseAmount(this.amountText()));

  readonly missing = computed<QuickEntryMissing[]>(() => {
    const missing: QuickEntryMissing[] = [];
    if (this.amount() === null) {
      missing.push('amount');
    }
    if (this.tile() === null) {
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
      default: return 'Shop wählen';
    }
  });

  pressKey(key: AmountKey): void {
    this.amountText.update(current => appendKey(current, key));
    this.collapseIfComplete();
  }

  selectTile(tile: QuickTile): void {
    this.tile.set(tile);
    this.shopName.set(tile.shopName);
    this.collapseIfComplete();
  }

  selectShop(name: string): void {
    this.shopName.set(name.trim() || null);
    this.collapseIfComplete();
  }

  openKeypad(): void {
    this.keypadOpen.set(true);
  }

  private collapseIfComplete(): void {
    if (this.canSave()) {
      this.keypadOpen.set(false);
    }
  }
}
