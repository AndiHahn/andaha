import { FormControl, FormGroup, Validators } from "@angular/forms";

export interface PaymentForm {
  payedHours: FormControl<string>;
  payedMoney: FormControl<number | null>;
  payedTip: FormControl<number | null>;
  notes: FormControl<string | null>;
}

export function getEmptyPaymentForm(payedHoursDefaultValue: string): FormGroup<PaymentForm> {
  return new FormGroup<PaymentForm>(
    {
      payedHours: new FormControl(payedHoursDefaultValue, { nonNullable: true, validators: [ Validators.required]}),
      payedMoney: new FormControl(null, { nonNullable: true, validators: [ Validators.required]}),
      payedTip: new FormControl(null, { nonNullable: true, validators: [ Validators.required]}),
      notes: new FormControl(null, { nonNullable: false })
    }
  );
}
