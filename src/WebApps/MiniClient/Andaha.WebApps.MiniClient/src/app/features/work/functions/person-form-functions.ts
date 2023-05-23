import { FormControl, FormGroup, Validators } from "@angular/forms";

export interface PersonForm {
  name: FormControl<string>;
  hourlyRate: FormControl<number>;
  notes: FormControl<string | null>;
}

export function getEmptyForm(): FormGroup<PersonForm> {
  return new FormGroup<PersonForm>(
    {
      name: new FormControl('', { nonNullable: true, validators: [ Validators.required ]}),
      hourlyRate: new FormControl(0, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]}),
      notes: new FormControl(null, { nonNullable: false }),
    }
  );
}
