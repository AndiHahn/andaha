import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CostCategory } from "src/app/api/budgetplan/dtos/CostCategory";
import { Duration } from "src/app/api/budgetplan/dtos/Duration";

export interface FixedCostForm {
  name: FormControl<string>;
  category: FormControl<CostCategory>;
  duration: FormControl<Duration>;
  value: FormControl<number | undefined>;
}

export function getEmptyForm(): FormGroup<FixedCostForm> {
  return new FormGroup<FixedCostForm>(
    {
      name: new FormControl('', { nonNullable: true, validators: [ Validators.required ]}),
      category: new FormControl(CostCategory.FlatAndOperating, { nonNullable: true, validators: [ Validators.required ]}),
      duration: new FormControl(Duration.Monthly, { nonNullable: true, validators: [ Validators.required ]}),
      value: new FormControl(undefined, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]})
    }
  );
}