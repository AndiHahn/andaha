import { Component, OnInit } from '@angular/core';
import { CreateWorkingEntriesDto } from 'src/app/api/work/dtos/CreateWorkingEntriesDto';
import { WorkingEntryForm, getEmptyWorkingEntryForm } from '../../../functions/working-entry-form-functions';
import { FormControl, FormGroup } from '@angular/forms';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkingEntriesContextGlobalService } from '../../../services/working-entries-context-global.service';
import * as moment from "moment";
import { Time } from "@angular/common";

@Component({
  selector: 'app-add-working-entry',
  templateUrl: './add-working-entry.component.html',
  styleUrls: ['./add-working-entry.component.scss'],
})
export class AddWorkingEntryComponent implements OnInit {

  form: FormGroup<WorkingEntryForm>;

  isSaving: boolean = false;

  constructor(
    private snackbar: MatSnackBar,
    private contextService: WorkingEntriesContextGlobalService
  ) {
    this.form = getEmptyWorkingEntryForm();
  }

  ngOnInit(): void {
  }

  getNgxTime(control: FormControl) : string {
    return moment(control.value).format('HH:mm');
  }

  setFormTime(control: FormControl, time: string): void {
    const currentDate = control.value;
    if (currentDate instanceof Date ) {
      const dateString = this.formatDateAsString(currentDate);
      const dateTimeString = dateString + " " + time;
      control.setValue(moment(dateTimeString).toDate());
    } else {
      const currentDateString = this.formatDateAsString(new Date());
      const currentDateTimeString = currentDateString + " " + time;
      const timeTyped = moment(currentDateTimeString).toDate();
      const currentTime = currentDate as Time;
      currentTime.hours = timeTyped.getHours();
      currentTime.minutes = timeTyped.getMinutes();
      control.setValue(currentTime);
    }
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
          //this.router.navigateByUrl('work/person')
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

    return {
      from: controls.date.value,
      until: controls.untilTime.value,
      break: controls.break.value,
      personIds: [ '' ],
      notes: controls.notes?.value ?? undefined
    }
  }

  private formatDateAsString(date: Date): string {
    return date.getFullYear() + "." + date.getMonth() + "." + date.getDate();
  }
}
