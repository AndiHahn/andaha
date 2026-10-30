import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { showError } from './show-error';

// Impure on purpose: the control is a mutable object (same reference, changing touched/invalid state),
// so a pure pipe would never re-evaluate. The function is a few property reads.
@Pipe({ name: 'showError', pure: false })
export class ShowErrorPipe implements PipeTransform {
  transform(control: AbstractControl | null, form?: FormGroupDirective | NgForm | null): boolean {
    return showError(control, form);
  }
}
