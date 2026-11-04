import { BillDto } from '../../../../api/shopping/dtos/BillDto';

export interface DuplicateCandidate {
  shopName: string;
  price: number;
  date: Date;
  categoryName: string;
  subCategoryName: string | null;
}

const norm = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase();
const cents = (value: number): number => Math.round(value * 100);
const sameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Kategorien werden per Name verglichen: Verbundene Konten haben eigene Kategorie-IDs.
export function findDuplicate(candidate: DuplicateCandidate, bills: BillDto[]): BillDto | undefined {
  return bills.find(b =>
    sameLocalDay(b.date, candidate.date)
    && cents(b.price) === cents(candidate.price)
    && norm(b.shopName) === norm(candidate.shopName)
    && norm(b.category.name) === norm(candidate.categoryName)
    && norm(b.subCategory?.name) === norm(candidate.subCategoryName));
}
