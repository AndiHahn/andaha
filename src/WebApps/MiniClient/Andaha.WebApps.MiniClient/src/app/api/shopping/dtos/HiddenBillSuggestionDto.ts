/** Ein ausgeblendeter Vorschlag der Schnellerfassung (GET api/bill-template/hidden-suggestions) */
export interface HiddenBillSuggestionDto {
  id: string;
  shopName: string;
  categoryId: string;
  categoryName: string;
  subCategoryId?: string | null;
  subCategoryName?: string | null;
}
