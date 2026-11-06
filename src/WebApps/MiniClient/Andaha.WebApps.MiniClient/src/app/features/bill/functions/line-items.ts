import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { parseAmount } from '../quick-entry/logic/amount-input';

const toCents = (value: number): number => Math.round(value * 100);

/** Summe der Positionen mit Gesamtpreis, auf Cent gerundet */
export function lineItemsSum(items: BillLineItemDto[]): number {
  const cents = items.reduce((sum, item) => (item.totalPrice == null ? sum : sum + toCents(item.totalPrice)), 0);
  return cents / 100;
}

/** Summe weicht um mehr als 0,01 vom Rechnungsbetrag ab (nur mit mindestens einer Position mit Preis) */
export function sumDeviates(items: BillLineItemDto[], price: number): boolean {
  if (!items.some(item => item.totalPrice != null)) {
    return false;
  }
  return Math.abs(toCents(lineItemsSum(items)) - toCents(price)) > 1;
}

/** Alle Positionen in Reihenfolge, `match` markiert Treffer (ohne Groß-/Kleinschreibung, Suchtext getrimmt) */
export function filterLineItems(items: BillLineItemDto[], query: string): { item: BillLineItemDto; match: boolean }[] {
  const needle = query.trim().toLowerCase();
  return items.map(item => ({
    item,
    match: needle !== '' && item.description.toLowerCase().includes(needle)
  }));
}

/** Position beim Bearbeiten und bei der Übernahme (design.md §5.2, §5.4) */
export interface LineItemDraft {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

/** Wie `LineItemData.MaxDescriptionLength` im Backend */
export const MAX_LINE_ITEM_DESCRIPTION = 200;

/** Wie `LineItemDataValidator` im Backend: höchstens 200 Positionen je Rechnung */
export const MAX_LINE_ITEMS = 200;

const MAX_QUANTITY = 2147483647;

/**
 * Dieselben Regeln wie `LineItemSanitizer` im Backend (design.md §5.1): Beschreibung getrimmt, ohne
 * Beschreibung fällt die Position weg, über 200 Zeichen wird gekürzt, Menge 0 oder negativ wird `null`.
 * Preise bleiben unverändert, auch negative (Rabatt, Pfand). Die Reihenfolge bleibt. Mehr als 200 nimmt
 * der Server nicht an: es bleiben die ersten 200.
 */
export function sanitizeDrafts(drafts: readonly {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}[]): LineItemDraft[] {
  const result: LineItemDraft[] = [];
  for (const draft of drafts) {
    if (result.length === MAX_LINE_ITEMS) {
      break;
    }
    const description = (draft.description ?? '').trim().slice(0, MAX_LINE_ITEM_DESCRIPTION);
    if (description.length === 0) {
      continue;
    }
    result.push({
      description,
      quantity: draft.quantity != null && draft.quantity > 0 ? draft.quantity : null,
      unitPrice: draft.unitPrice ?? null,
      totalPrice: draft.totalPrice ?? null
    });
  }
  return result;
}

/**
 * Gesamtpreis aus der Eingabe: Komma oder Punkt, höchstens zwei Nachkommastellen, auch 0 und negativ.
 * Leer → `null`, ungültig → `undefined`.
 */
export function parseLineItemPrice(text: string): number | null | undefined {
  const value = text.trim();
  if (value === '') {
    return null;
  }
  const negative = /^[-−]/.test(value);
  const rest = negative ? value.slice(1).trim() : value;
  const amount = parseAmount(rest);
  if (amount !== null) {
    return negative ? -amount : amount;
  }
  return /^0+(?:[.,]0{0,2})?$/.test(rest) ? 0 : undefined;
}

/** Menge aus der Eingabe: ganze Zahl ≥ 1. Leer → `null`, ungültig → `undefined`. */
export function parseLineItemQuantity(text: string): number | null | undefined {
  const value = text.trim();
  if (value === '') {
    return null;
  }
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  const quantity = Number(value);
  return quantity >= 1 && quantity <= MAX_QUANTITY ? quantity : undefined;
}
