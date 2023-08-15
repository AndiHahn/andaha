import { Time } from "@angular/common";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { PersonDto } from "src/app/api/work/dtos/PersonDto";
import { WorkingEntryDto } from "src/app/api/work/dtos/WorkingEntryDto";

export interface WorkingEntryForm {
  date: FormControl<Date>;
  fromTime: FormControl<Date>;
  untilTime: FormControl<Date>;
  break: FormControl<Time>;
  selectedPersons: FormControl<PersonDto[]>;
  notes: FormControl<string | null>;
}

export function getEmptyWorkingEntryForm(): FormGroup<WorkingEntryForm> {
  return new FormGroup<WorkingEntryForm>(
    {
      date: new FormControl(getTimeForToday(0), { nonNullable: true, validators: [ Validators.required ]}),
      fromTime: new FormControl(getTimeForToday(7), { nonNullable: true, validators: [ Validators.required ]}),
      untilTime: new FormControl(getTimeForToday(17), { nonNullable: true, validators: [ Validators.required ]}),
      break: new FormControl({ hours: 1, minutes: 0 }, { nonNullable: true, validators: [ Validators.required]}),
      selectedPersons: new FormControl([], { nonNullable: true, validators: [ Validators.required]}),
      notes: new FormControl(null, { nonNullable: false })
    }
  );
}

export function getWorkingEntryForm(entry: WorkingEntryDto): FormGroup<WorkingEntryForm> {
  
  return new FormGroup<WorkingEntryForm>(
    {
      date: new FormControl(entry.from, { nonNullable: true, validators: [ Validators.required ]}),
      fromTime: new FormControl(entry.from, { nonNullable: true, validators: [ Validators.required ]}),
      untilTime: new FormControl(entry.until, { nonNullable: true, validators: [ Validators.required ]}),
      break: new FormControl({ hours: entry.break.hours, minutes: entry.break.minutes }, { nonNullable: true, validators: [ Validators.required]}),
      selectedPersons: new FormControl([], { nonNullable: true, validators: [ Validators.required]}),
      notes: new FormControl(entry.notes ?? null, { nonNullable: false })
    }
  );
}

function getTimeForToday(hour: number): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
}
