import { PagedResultDto } from "../../common-dtos/PagedResultDto";
import { BillDto, BillDtoRaw, mapBillDtoRaw } from "./BillDto";

/** Summe eines Monats ("yyyy-MM") über alle Treffer der Suche, nicht nur über die geladene Seite */
export interface MonthSumDto {
  month: string;
  sum: number;
}

/** Ergebnis von GET api/bill: eine Seite plus Gesamtsumme und Monatssummen (absteigend) aller Treffer */
export interface BillSearchResultDto<TBill = BillDto> extends PagedResultDto<TBill> {
  totalSum: number;
  monthSums: MonthSumDto[];
}

export function mapBillSearchResultDtoRaw(raw: BillSearchResultDto<BillDtoRaw>): BillSearchResultDto {
  return {
    ...raw,
    values: raw.values.map(mapBillDtoRaw),
    totalSum: raw.totalSum ?? 0,
    monthSums: raw.monthSums ?? []
  };
}
