export interface BillSuggestionDto {
  shopName: string;
  categoryId: string;
  subCategoryId?: string | null;
  count: number;
}

export interface BillSuggestionKey {
  shopName: string;
  categoryId: string;
  subCategoryId?: string | null;
}
