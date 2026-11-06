import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';

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
