import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { showError } from './show-error';
import { ShowErrorPipe } from './show-error.pipe';

describe('showError', () => {
  const invalid = () => new FormControl('', Validators.required);

  it('false for valid control', () => {
    const c = new FormControl('x', Validators.required);
    c.markAsTouched();
    expect(showError(c)).toBeFalse();
  });

  it('false for invalid untouched control without submitted form', () => {
    expect(showError(invalid(), { submitted: false } as FormGroupDirective)).toBeFalse();
    expect(showError(invalid())).toBeFalse();
  });

  it('true for invalid touched control', () => {
    const c = invalid();
    c.markAsTouched();
    expect(showError(c)).toBeTrue();
  });

  it('true for invalid untouched control when form submitted', () => {
    expect(showError(invalid(), { submitted: true } as NgForm)).toBeTrue();
  });

  it('false for null control', () => {
    expect(showError(null)).toBeFalse();
    expect(showError(null, { submitted: true } as NgForm)).toBeFalse();
  });

  it('pipe delegates to showError', () => {
    const c = invalid();
    c.markAsTouched();
    expect(new ShowErrorPipe().transform(c)).toBeTrue();
    expect(new ShowErrorPipe().transform(null)).toBeFalse();
  });
});
