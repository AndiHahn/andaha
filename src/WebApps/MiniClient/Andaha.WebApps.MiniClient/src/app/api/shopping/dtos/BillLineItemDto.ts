/** Position einer Rechnung (geordnet wie auf dem Beleg) */
export interface BillLineItemDto {
  id: string;
  description: string;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}

/** Position beim Anlegen/Bearbeiten; wird als JSON-Text im Formularfeld `lineItems` gesendet */
export type BillLineItemInputDto = Omit<BillLineItemDto, 'id'>;

/** Treffer der Positionssuche in der Rechnungsliste */
export interface MatchedLineItemDto {
  description: string;
  totalPrice?: number | null;
}
