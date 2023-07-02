import { FormControl, FormGroup, Validators } from "@angular/forms";
import { PersonDto } from "src/app/api/work/dtos/PersonDto";

export interface PersonForm {
  name: FormControl<string>;
  hourlyRate: FormControl<number>;
  notes: FormControl<string | null>;
}

export function getEmptyPersonForm(): FormGroup<PersonForm> {
  return new FormGroup<PersonForm>(
    {
      name: new FormControl('', { nonNullable: true, validators: [ Validators.required ]}),
      hourlyRate: new FormControl(0, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]}),
      notes: new FormControl(null, { nonNullable: false }),
    }
  );
}

export function getPersonForm(person: PersonDto): FormGroup<PersonForm> {
  return new FormGroup<PersonForm>(
    {
      name: new FormControl(person.name, { nonNullable: true, validators: [ Validators.required ]}),
      hourlyRate: new FormControl(person.hourlyRate, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]}),
      notes: new FormControl(person.notes ?? '', { nonNullable: false }),
    }
  );
}
