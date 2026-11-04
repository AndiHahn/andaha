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
  return { ...raw, lastUsed: new Date(raw.lastUsed) };
}
