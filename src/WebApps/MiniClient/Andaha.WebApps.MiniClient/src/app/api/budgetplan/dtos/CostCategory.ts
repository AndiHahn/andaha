export enum CostCategory {
  FlatAndOperating = 'FlatAndOperating',
  MotorVehicle = 'MotorVehicle',
  Insurance = 'Insurance',
  Saving = 'Saving',
  Other = 'Other'
}

export const CostCategoryLabel = new Map<string, string>([
  [CostCategory.FlatAndOperating, 'Wohnen'],
  [CostCategory.MotorVehicle, 'Auto'],
  [CostCategory.Insurance, 'Versicherung'],
  [CostCategory.Saving, 'Sparen'],
  [CostCategory.Other, 'Andere']
]);
