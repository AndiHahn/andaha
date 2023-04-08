export interface BillUpdateDto {
  categoryId: string;
  subCategoryId?: string;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
  image?: File;
}
