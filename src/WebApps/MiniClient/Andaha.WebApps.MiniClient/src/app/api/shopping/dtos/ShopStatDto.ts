import { parseLocalDateTime } from "src/app/shared/utils/utils";

export interface ShopStatDto {
  shopName: string;
  categoryId: string;
  subCategoryId?: string | null;
  count: number;
  lastUsed: Date;
}

export interface ShopStatDtoRaw extends Omit<ShopStatDto, 'lastUsed'> {
  lastUsed: string;
}

export function mapShopStatDtoRaw(raw: ShopStatDtoRaw): ShopStatDto {
  // letztes Rechnungsdatum: gespeicherte Ortszeit wie bei mapBillDtoRaw
  return { ...raw, lastUsed: parseLocalDateTime(raw.lastUsed) };
}
