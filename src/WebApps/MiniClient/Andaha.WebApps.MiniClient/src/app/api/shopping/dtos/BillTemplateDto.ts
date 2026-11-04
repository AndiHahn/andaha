export interface BillTemplateDto {
  id: string;
  name?: string | null;
  shopName?: string | null;
  categoryId: string;
  subCategoryId?: string | null;
  sortOrder: number;
}

export interface BillTemplateCreateDto {
  name?: string;
  shopName?: string | null;
  categoryId: string;
  subCategoryId?: string | null;
}
