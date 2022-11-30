import { FixedCostHistoryDto, RawFixedCostHistoryDto } from "../dtos/FixedCostHistoryDto";

export function mapFixedCostHistoryList(raw: RawFixedCostHistoryDto[]): FixedCostHistoryDto[] {
  return raw.map(mapFixedCostHistory);
}

export function mapFixedCostHistory(raw: RawFixedCostHistoryDto): FixedCostHistoryDto {
  return {
    fixedCost: raw.fixedCost,
    validFrom: new Date(raw.validFrom),
    validTo: new Date(raw.validTo)
  }
}
