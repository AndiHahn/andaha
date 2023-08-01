import { Time } from "@angular/common";
import { FormControl, FormGroup, Validators } from "@angular/forms";

export interface WorkingEntryForm {
  date: FormControl<Date>;
  fromTime: FormControl<Date>;
  untilTime: FormControl<Date>;
  break: FormControl<Time>;
  personId: FormControl<string>;
  notes: FormControl<string | null>;
}

export function getEmptyWorkingEntryForm(): FormGroup<WorkingEntryForm> {
  return new FormGroup<WorkingEntryForm>(
    {
      date: new FormControl(getTimeForToday(7), { nonNullable: true, validators: [ Validators.required ]}),
      fromTime: new FormControl(getTimeForToday(7), { nonNullable: true, validators: [ Validators.required ]}),
      untilTime: new FormControl(getTimeForToday(17), { nonNullable: true, validators: [ Validators.required ]}),
      break: new FormControl({ hours: 1, minutes: 0 }, { nonNullable: true, validators: [ Validators.required]}),
      personId: new FormControl('', { nonNullable: true, validators: [ Validators.required]}),
      notes: new FormControl(null, { nonNullable: false })
    }
  );
}

/*
export function getPersonForm(person: PersonDto): FormGroup<PersonForm> {
  return new FormGroup<PersonForm>(
    {
      name: new FormControl(person.name, { nonNullable: true, validators: [ Validators.required ]}),
      hourlyRate: new FormControl(person.hourlyRate, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]}),
      notes: new FormControl(person.notes ?? '', { nonNullable: false }),
    }
  );
}
*/

function getTimeForToday(hour: number): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDay(), hour, 0, 0);
}
