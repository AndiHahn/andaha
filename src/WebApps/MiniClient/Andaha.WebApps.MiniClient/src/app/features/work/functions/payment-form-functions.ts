import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { isValidPayedHours } from "./payment-functions";

export interface PaymentForm {
  payedHours: FormControl<string>;
  payedMoney: FormControl<number | null>;
  payedTip: FormControl<number | null>;
  notes: FormControl<string | null>;
}

export interface PaymentFormValues {
  payedHours: string;
  payedMoney: number | null;
  payedTip: number | null;
  notes?: string | null;
}

/** Zahlungsformular; bezahlte Stunden „h:mm“ größer als 0, Betrag größer als 0, Trinkgeld ab 0 (wie die Backend-Validatoren) */
export function getPaymentForm(values: PaymentFormValues): FormGroup<PaymentForm> {
  return new FormGroup<PaymentForm>(
    {
      payedHours: new FormControl(values.payedHours, { nonNullable: true, validators: [ Validators.required, payedHoursValidator ]}),
      payedMoney: new FormControl(values.payedMoney, { nonNullable: true, validators: [ Validators.required, greaterThanZeroValidator ]}),
      payedTip: new FormControl(values.payedTip, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]}),
      notes: new FormControl(values.notes ?? null, { nonNullable: false })
    }
  );
}

function payedHoursValidator(control: AbstractControl<string | null>): ValidationErrors | null {
  return isValidPayedHours(control.value) ? null : { payedHours: true };
}

function greaterThanZeroValidator(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value === null || value === undefined || value > 0 ? null : { greaterThanZero: true };
}
