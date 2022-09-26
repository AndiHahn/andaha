export interface BillCreateDto {
  categoryId: string;
  shopName: string;
  price: number;
  date?: Date;
  notes?: string;
}
