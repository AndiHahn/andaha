import { IncomeDto } from "./IncomeDto";

export interface IncomeHistoryDto {
  income: IncomeDto;
  validFrom: Date;
  validTo: Date;
}

export interface RawIncomeHistoryDto {
  income: IncomeDto;
  validFrom: string;
  validTo: string;
}
