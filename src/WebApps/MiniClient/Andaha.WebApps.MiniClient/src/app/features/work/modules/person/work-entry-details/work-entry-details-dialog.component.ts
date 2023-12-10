import { Component, Inject, OnInit } from '@angular/core';
import { WorkingEntryForm, getWorkingEntryForm } from '../../../functions/working-entry-form-functions';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { getTotalWorkingTimeString } from '../../../functions/date-time-functions';
import * as moment from 'moment';
import { Time } from '@angular/common';
import { WorkEntryDetailsDialogData } from './WorkEntryDetailsDialogData';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { UpdateWorkingEntryDto } from 'src/app/api/work/dtos/UpdateWorkingEntryDto';
import { formatTime } from 'src/app/api/functions/api-utils';

@Component({
  selector: 'app-work-entry-details-dialog',
  templateUrl: './work-entry-details-dialog.component.html',
  styleUrls: ['./work-entry-details-dialog.component.scss']
})
export class WorkEntryDetailsDialogComponent implements OnInit {

  form: FormGroup<WorkingEntryForm>;

  workingEntry: WorkingEntryDto;

  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;

  constructor(
    private snackbar: MatSnackBar,
    private apiService: WorkingEntryApiService,
    private confirmationDialog: ConfirmationDialogService,
    private dialogRef: MatDialogRef<WorkEntryDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: WorkEntryDetailsDialogData
  ) {
    this.workingEntry = data.workEntry;

    this.form = getWorkingEntryForm(data.workEntry);

    // set placeholder person in order to re-use the WorkEntryForm.
    // the person is not required in this context and not shown in the UI
    this.form.controls.selectedPersons.setValue([ {
      id: 'placeholder-id',
      name: 'placeholder-name',
      hourlyRate: 0,
      totalHours: { hours: 0, minutes: 0},
      payedHours: { hours: 0, minutes: 0}
    }]);

    this.form.disable();
  }

  ngOnInit(): void {
  }

  getNgxTime(control: FormControl) : string {
    return moment(control.value).format('HH:mm');
  }

  getWorkingTime(): string {
    return getTotalWorkingTimeString({
      from: this.form.controls.fromTime.value,
      until: this.form.controls.untilTime.value,
      break: this.form.controls.break.value
    });
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

  private formatDateAsString(date: Date): string {
    return date.getUTCFullYear() + "." + (date.getUTCMonth() + 1) + "." + date.getUTCDate();
  }
  
  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = getWorkingEntryForm(this.workingEntry);
    this.form.disable();
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createUpdateDtoFromForm();

    this.apiService.updateWorkingEntry(this.data.workEntry.id, dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.dialogRef.close(true);
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar("Person konnte nicht gespeichert werden.", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll diese Arbeitszeit wirklich gelöscht werden?'
    }

    this.confirmationDialog.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: confirmed => {
          if (confirmed) {
            this.delete();
          }
        }
      }
    ));
  }

  private delete(): void {
    this.isDeleting = true;

    this.apiService.deleteWorkingEntry(this.workingEntry.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.dialogRef.close(true);
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Arbeitszeit konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private createUpdateDtoFromForm(): UpdateWorkingEntryDto {
    const controls = this.form.controls;

    const date = moment(controls.date.value).toDate();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getDate();
    const fromTime = controls.fromTime.value;
    const untilTime = controls.untilTime.value;
    const fromDate = new Date(year, month, day, fromTime.getHours(), fromTime.getMinutes(), fromTime.getSeconds());
    const untilDate = new Date(year, month, day, untilTime.getHours(), untilTime.getMinutes(), untilTime.getSeconds());

    return {
      from: fromDate,
      until: untilDate,
      break: formatTime(controls.break.value),
      notes: controls.notes?.value ?? undefined
    }
  }
}
