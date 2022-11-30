import { FixedCostDto } from "./FixedCostDto";

export interface FixedCostHistoryDto {
  fixedCost: FixedCostDto;
  validFrom: Date;
  validTo: Date;
}

export interface RawFixedCostHistoryDto {
  fixedCost: FixedCostDto;
  validFrom: string;
  validTo: string;
}
