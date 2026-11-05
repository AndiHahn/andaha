import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { PersonPaymentDialogData } from './PersonPaymentDialogData';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentForm, getPaymentForm } from '../../../functions/payment-form-functions';
import { paymentPrefillFor } from '../../../functions/payment-functions';
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
export class PersonPaymentDialogComponent {
  private snackbar = inject(MatSnackBar);
  private personContextService = inject(PersonContextService);
  private dialogRef = inject<MatDialogRef<PersonPaymentDialogComponent>>(MatDialogRef);
  private data = inject<PersonPaymentDialogData>(MAT_DIALOG_DATA);

  readonly title = this.data.payment ? 'Zahlung bearbeiten' : 'Zahlung hinzufügen';

  form: FormGroup<PaymentForm>;

  isSaving: boolean = false;

  constructor() {
    const payment = this.data.payment;

    this.form = payment
      ? getPaymentForm({
          payedHours: formatTimeWithoutSeconds(payment.payedHours),
          payedMoney: payment.payedMoney,
          payedTip: payment.payedTip,
          notes: payment.notes ?? null
        })
      : getPaymentForm(paymentPrefillFor(this.data.openHours, this.data.hourlyRate));

    // z. B. mehr bezahlt als gearbeitet: vorbelegt ist 0:00, der Fehler steht sofort am Feld statt erst beim Speichern
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();
    const payment = this.data.payment;
    const save$ = payment
      ? this.personContextService.updatePayment(this.data.personId, payment.id, dto)
      : this.personContextService.addPayment(this.data.personId, dto);

    save$.subscribe(
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
