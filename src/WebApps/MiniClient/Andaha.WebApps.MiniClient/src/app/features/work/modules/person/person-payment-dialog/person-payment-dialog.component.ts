import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PersonPaymentDialogData } from './PersonPaymentDialogData';
import { FormGroup } from '@angular/forms';
import { PaymentForm, getEmptyPaymentForm } from '../../../functions/payment-form-functions';
import { PersonContextService } from '../../../services/person-context.service';
import { PayPersonDto } from 'src/app/api/work/dtos/PayPersonDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { formatTime, formatTimeWithoutSeconds, getHoursFromTimeString, getMinutesFromTimeString } from 'src/app/api/functions/api-utils';
import { Time } from '@angular/common';

@Component({
  selector: 'app-person-payment-dialog',
  templateUrl: './person-payment-dialog.component.html',
  styleUrls: ['./person-payment-dialog.component.scss']
})
export class PersonPaymentDialogComponent implements OnInit {

  form: FormGroup<PaymentForm>;

  isSaving: boolean = false;

  constructor(
    private snackbar: MatSnackBar,
    private personContextService: PersonContextService,
    private dialogRef: MatDialogRef<PersonPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: PersonPaymentDialogData
  ) {
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
