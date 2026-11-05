import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillCreatePrefill } from '../models/bill-create-prefill';
import { toDayKey } from '../quick-entry/logic/quick-entry-state';

/**
 * Vorbelegung des großen Formulars beim Duplizieren (design.md §3.1): Preis, Shop, Kategorie,
 * Unterkategorie und Notizen der Rechnung, Datum heute, ohne Foto.
 */
export function duplicatePrefill(bill: BillDto, today: Date): BillCreatePrefill {
  return {
    price: bill.price,
    shopName: bill.shopName,
    categoryId: bill.category.id,
    subCategoryId: bill.subCategory?.id ?? null,
    notes: bill.notes,
    date: toDayKey(today)
  };
}
