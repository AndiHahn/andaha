export interface AnalyzeBillLineItemResultDto {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}

export interface AnalyzeBillResultDto {
  shopName?: string | null;
  date?: string | null;
  totalAmount?: number | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  confidence?: number | null;
  lineItems: AnalyzeBillLineItemResultDto[];
}
