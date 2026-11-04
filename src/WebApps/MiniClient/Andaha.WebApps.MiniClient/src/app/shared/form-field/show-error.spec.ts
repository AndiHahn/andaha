import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { showError } from './show-error';
import { ShowErrorPipe } from './show-error.pipe';

describe('showError', () => {
    const invalid = () => new FormControl('', Validators.required);

    it('false for valid control', () => {
        const c = new FormControl('x', Validators.required);
        c.markAsTouched();
        expect(showError(c)).toBe(false);
    });

    it('false for invalid untouched control without submitted form', () => {
        expect(showError(invalid(), { submitted: false } as FormGroupDirective)).toBe(false);
        expect(showError(invalid())).toBe(false);
    });

    it('true for invalid touched control', () => {
        const c = invalid();
        c.markAsTouched();
        expect(showError(c)).toBe(true);
    });

    it('true for invalid untouched control when form submitted', () => {
        expect(showError(invalid(), { submitted: true } as NgForm)).toBe(true);
    });

    it('false for null control', () => {
        expect(showError(null)).toBe(false);
        expect(showError(null, { submitted: true } as NgForm)).toBe(false);
    });

    it('pipe delegates to showError', () => {
        const c = invalid();
        c.markAsTouched();
        expect(new ShowErrorPipe().transform(c)).toBe(true);
        expect(new ShowErrorPipe().transform(null)).toBe(false);
    });
});
