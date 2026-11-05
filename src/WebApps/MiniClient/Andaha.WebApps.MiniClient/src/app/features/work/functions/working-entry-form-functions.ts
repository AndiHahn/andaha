import { Time } from "@angular/common";
import { FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import moment from "moment";
import { createTimeDisplayName, formatLocalTime, netWorkingTime, timeToMinutes, toLocalDateTime, validateWorkTime } from "./date-time-functions";
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
    },
    { validators: [ workTimeValidator ] }
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
    },
    { validators: [ workTimeValidator ] }
  );
}

/** Das Formular-Datum kann ein Date (Vorbelegung) oder ein Moment (Datepicker) sein; ergibt immer ein lokales Date */
export function formDay(value: unknown): Date {
  return moment(value as moment.MomentInput).toDate();
}

/** Setzt eine Uhrzeit „HH:mm“ aus dem Timepicker: Zeitpunkt-Felder behalten ihren lokalen Tag, Pause wird Stunden/Minuten */
export function applyPickedTime(control: FormControl, newTime: string): void {
  const current = control.value;
  if (current instanceof Date) {
    control.setValue(toLocalDateTime(current, newTime));
    return;
  }

  const [hours, minutes] = newTime.split(':').map(part => Number(part));
  control.setValue({ hours: hours || 0, minutes: minutes || 0 });
}

export interface FormWorkTime {
  from: Date;
  until: Date;
  breakMinutes: number;
}

/** Beginn und Ende auf dem gewählten Tag (lokal) und Pause in Minuten; `null`, solange das Datum fehlt */
export function getFormWorkTime(form: FormGroup<WorkingEntryForm>): FormWorkTime | null {
  const { date, fromTime, untilTime, break: breakTime } = form.getRawValue();
  if (!date || !fromTime || !untilTime || !breakTime) {
    return null;
  }

  const day = formDay(date);
  return {
    from: toLocalDateTime(day, formatLocalTime(fromTime)),
    until: toLocalDateTime(day, formatLocalTime(untilTime)),
    breakMinutes: timeToMinutes(breakTime)
  };
}

/** Gruppen-Validator: Ende nach Beginn (Fehler `untilNotAfterFrom`), Pause kürzer als die Arbeitszeit (`breakTooLong`) */
export const workTimeValidator: ValidatorFn = control => {
  const workTime = getFormWorkTime(control as FormGroup<WorkingEntryForm>);
  if (!workTime) {
    return null;
  }

  const error = validateWorkTime(workTime.from, workTime.until, workTime.breakMinutes);
  if (error === 'until-not-after-from') {
    return { untilNotAfterFrom: true };
  }
  return error === 'break-too-long' ? { breakTooLong: true } : null;
};

/** Netto-Arbeitszeit des Formulars als „HH:mm h“, „–“ bei ungültiger Eingabe */
export function getNetWorkingTimeText(form: FormGroup<WorkingEntryForm>): string {
  const workTime = getFormWorkTime(form);
  const minutes = workTime ? netWorkingTime(workTime.from, workTime.until, workTime.breakMinutes) : null;

  return minutes === null ? '–' : createTimeDisplayName({ hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export const UNTIL_BEFORE_FROM_TEXT = 'Ende liegt vor dem Beginn';
export const BREAK_TOO_LONG_TEXT = 'Pause ist länger als die Arbeitszeit';

function getTimeForToday(hour: number): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
}
