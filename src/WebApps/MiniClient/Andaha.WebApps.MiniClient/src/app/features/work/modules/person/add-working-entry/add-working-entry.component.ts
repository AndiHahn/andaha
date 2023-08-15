import { Component, OnInit } from '@angular/core';
import { CreateWorkingEntriesDto } from 'src/app/api/work/dtos/CreateWorkingEntriesDto';
import { WorkingEntryForm, getEmptyWorkingEntryForm } from '../../../functions/working-entry-form-functions';
import { FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkingEntriesContextGlobalService } from '../../../services/working-entries-context-global.service';
import * as moment from "moment";
import { Time } from "@angular/common";
import { PersonContextService } from '../../../services/person-context.service';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { getTotalWorkingTimeString } from '../../../functions/date-time-functions';
import { formatTime } from 'src/app/api/functions/api-utils';

@Component({
  selector: 'app-add-working-entry',
  templateUrl: './add-working-entry.component.html',
  styleUrls: ['./add-working-entry.component.scss'],
})
export class AddWorkingEntryComponent implements OnInit {

  form: FormGroup<WorkingEntryForm>;

  persons?: PersonDto[];
  filteredPersons?: PersonDto[];

  isSaving: boolean = false;

  constructor(
    private snackbar: MatSnackBar,
    private personContextService: PersonContextService,
    private contextService: WorkingEntriesContextGlobalService
  ) {
    this.form = getEmptyWorkingEntryForm();
  }

  ngOnInit(): void {
    this.personContextService.persons().subscribe(
      {
        next: persons => {
          if (!this.persons) {
            this.persons = persons;
            this.filteredPersons = persons;
          }
        }
      }
    );
  }

  onInputChange(event: any) {
    if (!this.persons) {
      return;
    }

    const searchInput = event.target.value.toLowerCase();

    this.filteredPersons = this.persons.filter(({ name }) => {
      const personName = name.toLowerCase();
      return personName.includes(searchInput);
    });
  }

  onOpenChange(searchInput: any) {
    searchInput.value = "";
    this.filteredPersons = this.persons;
  }

  getNgxTime(control: FormControl) : string {
    return moment(control.value).format('HH:mm');
  }

  setFormTime(control: FormControl, newTime: string): void {
    const currentDate = control.value;
    if (currentDate instanceof Date) {
      const dateString = this.formatDateAsString(currentDate);
      const dateTimeString = dateString + " " + newTime;
      control.setValue(moment(dateTimeString).toDate());
    } else {
      const currentDateString = this.formatDateAsString(new Date());
      const currentDateTimeString = currentDateString + " " + newTime;
      const timeTyped = moment(currentDateTimeString).toDate();
      const currentTime = currentDate as Time;
      currentTime.hours = timeTyped.getHours();
      currentTime.minutes = timeTyped.getMinutes();
      control.setValue(currentTime);
    }
  }

  getPersonDisplayText(): string {
    const personNames = this.form.controls.selectedPersons.value.map(person => person.name);

    return personNames.join(", ");
  }

  getWorkingTime(): string {
    return getTotalWorkingTimeString({
      from: this.form.controls.fromTime.value,
      until: this.form.controls.untilTime.value,
      break: this.form.controls.break.value
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.contextService.createEntries(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.form.controls.selectedPersons.reset();
          this.personContextService.refetch();
          openInformationSnackbar('Arbeitszeit wurde gespeichert', this.snackbar);
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Eintrag konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
  }

  private createDtoFromForm(): CreateWorkingEntriesDto {
    const controls = this.form.controls;

    const date = moment(controls.date.value).toDate();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate() + 1;
    const fromTime = controls.fromTime.value;
    const untilTime = controls.untilTime.value;
    const fromDate = new Date(year, month, day, fromTime.getHours(), fromTime.getMinutes(), fromTime.getSeconds());
    const untilDate = new Date(year, month, day, untilTime.getHours(), untilTime.getMinutes(), untilTime.getSeconds());

    return {
      from: fromDate,
      until: untilDate,
      break: formatTime(controls.break.value),
      personIds: controls.selectedPersons.value.map(person => person.id),
      notes: controls.notes?.value ?? undefined
    }
  }

  private formatDateAsString(date: Date): string {
    return date.getUTCFullYear() + "." + (date.getUTCMonth() + 1) + "." + date.getUTCDate();
  }
}
