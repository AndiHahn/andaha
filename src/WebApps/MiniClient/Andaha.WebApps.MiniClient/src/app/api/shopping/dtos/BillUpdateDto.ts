import { BillLineItemInputDto } from "./BillLineItemDto";

export interface BillUpdateDto {
  categoryId: string;
  subCategoryId?: string;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
  image?: File;
  /** Ohne Feld bleiben die Positionen unverändert, [] entfernt sie */
  lineItems?: BillLineItemInputDto[];
}
