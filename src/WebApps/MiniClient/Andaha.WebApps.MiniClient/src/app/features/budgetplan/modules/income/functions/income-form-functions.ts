import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Duration } from "src/app/api/budgetplan/dtos/Duration";

export interface IncomeForm {
  name: FormControl<string>;
  duration: FormControl<Duration>;
  value: FormControl<number | undefined>;
}

export function getEmptyForm(): FormGroup<IncomeForm> {
  return new FormGroup<IncomeForm>(
    {
      name: new FormControl('', { nonNullable: true, validators: [ Validators.required ]}),
      duration: new FormControl(Duration.Monthly, { nonNullable: true, validators: [ Validators.required ]}),
      value: new FormControl(undefined, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]})
    }
  );
}