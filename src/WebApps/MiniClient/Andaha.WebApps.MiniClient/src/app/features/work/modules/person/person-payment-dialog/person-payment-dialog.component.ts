import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { PersonPaymentDialogData } from './PersonPaymentDialogData';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentForm, getEmptyPaymentForm } from '../../../functions/payment-form-functions';
import { PersonContextService } from '../../../services/person-context.service';
import { PayPersonDto } from 'src/app/api/work/dtos/PayPersonDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { formatTime, formatTimeWithoutSeconds, getHoursFromTimeString, getMinutesFromTimeString } from 'src/app/api/functions/api-utils';
import { Time } from '@angular/common';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-person-payment-dialog',
    templateUrl: './person-payment-dialog.component.html',
    styleUrls: ['./person-payment-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, FormsModule, ReactiveFormsModule, CdkScrollable, MatDialogContent, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class PersonPaymentDialogComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private personContextService = inject(PersonContextService);
  private dialogRef = inject<MatDialogRef<PersonPaymentDialogComponent>>(MatDialogRef);
  private data = inject<PersonPaymentDialogData>(MAT_DIALOG_DATA);


  form: FormGroup<PaymentForm>;

  isSaving: boolean = false;

  constructor() {
    const data = this.data;

    const openHours = formatTimeWithoutSeconds(data.openHours);
    this.form = getEmptyPaymentForm(openHours);
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.personContextService.addPayment(this.data.personId, dto).subscribe(
      {
        next: _ =>{
          this.isSaving = false;
          this.dialogRef.close(dto.payedHours);
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Zahlung konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
  }

  private createDtoFromForm(): PayPersonDto {
    const controls = this.form.controls;

    const payedHoursTime: Time = {
      hours: getHoursFromTimeString(controls.payedHours.value),
      minutes: getMinutesFromTimeString(controls.payedHours.value)
    }

    return {
      payedHours: formatTime(payedHoursTime),
      payedMoney: controls.payedMoney.value!,
      payedTip: controls.payedTip.value!,
      notes: controls.notes?.value ?? undefined
    }
  }

}
