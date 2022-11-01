export interface BillUpdateDto {
  categoryId: string;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
}
