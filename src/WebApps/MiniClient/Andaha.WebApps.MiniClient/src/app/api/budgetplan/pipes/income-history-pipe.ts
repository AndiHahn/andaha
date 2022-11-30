import { IncomeHistoryDto, RawIncomeHistoryDto } from "../dtos/IncomeHistoryDto";

export function mapIncomeHistoryList(raw: RawIncomeHistoryDto[]): IncomeHistoryDto[] {
  return raw.map(mapIncomeHistory);
}

export function mapIncomeHistory(raw: RawIncomeHistoryDto): IncomeHistoryDto {
  return {
    income: raw.income,
    validFrom: new Date(raw.validFrom),
    validTo: new Date(raw.validTo)
  }
}
