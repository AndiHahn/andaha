import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';

/**
 * Same rule as Angular Material's default ErrorStateMatcher:
 * show the error when the control is invalid and was touched or the form was submitted.
 */
export function showError(control: AbstractControl | null, form?: FormGroupDirective | NgForm | null): boolean {
  return !!control && control.invalid && (control.touched || !!form?.submitted);
}
