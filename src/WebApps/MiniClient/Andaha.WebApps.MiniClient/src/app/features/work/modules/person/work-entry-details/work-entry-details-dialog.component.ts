import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { WorkingEntryForm, getWorkingEntryForm } from '../../../functions/working-entry-form-functions';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { getTotalWorkingTimeString } from '../../../functions/date-time-functions';
import moment from 'moment';
import { Time } from '@angular/common';
import { WorkEntryDetailsDialogData } from './WorkEntryDetailsDialogData';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';
import { UpdateWorkingEntryDto } from 'src/app/api/work/dtos/UpdateWorkingEntryDto';
import { formatTime } from 'src/app/api/functions/api-utils';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DatePickerFormFieldComponent } from '../../../../../shared/date-picker/date-picker-form-field/date-picker-form-field.component';
import { TimePickerFormFieldComponent } from '../../../../../shared/date-picker/time-picker-form-field/time-picker-form-field.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-work-entry-details-dialog',
    templateUrl: './work-entry-details-dialog.component.html',
    styleUrls: ['./work-entry-details-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, DatePickerFormFieldComponent, TimePickerFormFieldComponent, MatProgressBar, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class WorkEntryDetailsDialogComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private apiService = inject(WorkingEntryApiService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private dialogRef = inject<MatDialogRef<WorkEntryDetailsDialogComponent>>(MatDialogRef);
  private data = inject<WorkEntryDetailsDialogData>(MAT_DIALOG_DATA);


  form: FormGroup<WorkingEntryForm>;

  workingEntry: WorkingEntryDto;

  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;

  constructor() {
    const data = this.data;

    this.workingEntry = data.workEntry;

    this.form = this.createForm();
    this.form.disable();
  }

  private createForm(): FormGroup<WorkingEntryForm> {
    const form = getWorkingEntryForm(this.workingEntry);

    // set placeholder person in order to re-use the WorkEntryForm.
    // the person is not required in this context and not shown in the UI
    form.controls.selectedPersons.setValue([ {
      id: 'placeholder-id',
      name: 'placeholder-name',
      hourlyRate: 0,
      totalHours: { hours: 0, minutes: 0},
      payedHours: { hours: 0, minutes: 0},
      payments: []
    }]);

    return form;
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
    this.form = this.createForm();
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
          this.isEditing = true;
          this.form.enable();
          openErrorSnackbar("Arbeitszeit konnte nicht gespeichert werden.", this.snackbar);
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
          vibrate();
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
