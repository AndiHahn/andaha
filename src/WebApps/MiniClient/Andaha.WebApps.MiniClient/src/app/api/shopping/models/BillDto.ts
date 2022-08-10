export interface BillDto {
  id: string;
  createdByUserId: string;
  categoryId: string;
  shopName: string;
  price: number;
  date: Date;
  notes: string;
}
