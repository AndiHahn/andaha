import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { PaymentDto } from 'src/app/api/work/dtos/PaymentDto';
import { PersonContextService } from '../../../services/person-context.service';
import { PersonPaymentDialogComponent } from './person-payment-dialog.component';
import { PersonPaymentDialogData } from './PersonPaymentDialogData';

describe('PersonPaymentDialogComponent', () => {
  let fixture: ComponentFixture<PersonPaymentDialogComponent>;
  let host: HTMLElement;
  let close: ReturnType<typeof vi.fn>;
  let context: { addPayment: ReturnType<typeof vi.fn>; updatePayment: ReturnType<typeof vi.fn> };

  const payment: PaymentDto = {
    id: 'pay-1',
    payedAt: new Date(2026, 9, 12),
    payedHours: { hours: 20, minutes: 0 },
    payedMoney: 300,
    payedTip: 20,
    notes: 'bar'
  };

  function setup(data: PersonPaymentDialogData): void {
    close = vi.fn();
    context = { addPayment: vi.fn().mockReturnValue(of(undefined)), updatePayment: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [PersonPaymentDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
        { provide: PersonContextService, useValue: context }
      ]
    });
    vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(PersonPaymentDialogComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  function saveButton(): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  it('is prefilled with the open hours, the open amount and tip 0', () => {
    setup({ personId: 'p-1', openHours: { hours: 12, minutes: 30 }, hourlyRate: 15 });

    expect(fixture.componentInstance.form.getRawValue()).toEqual({ payedHours: '12:30', payedMoney: 187.5, payedTip: 0, notes: null });
    expect(saveButton().disabled).toBe(false);
    expect(host.textContent).toContain('Zahlung hinzufügen');
  });

  it('adds the payment with the prefilled values', () => {
    setup({ personId: 'p-1', openHours: { hours: 12, minutes: 30 }, hourlyRate: 15 });

    saveButton().click();

    expect(context.addPayment).toHaveBeenCalledWith('p-1', { payedHours: '12:30:00', payedMoney: 187.5, payedTip: 0, notes: undefined });
    expect(close).toHaveBeenCalled();
  });

  it('prefills 0:00 when more was paid than worked and shows the validation error instead of submitting', () => {
    setup({ personId: 'p-1', openHours: { hours: -3, minutes: 30 }, hourlyRate: 15 });

    expect(fixture.componentInstance.form.controls.payedHours.value).toBe('00:00');
    expect(fixture.componentInstance.form.controls.payedMoney.value).toBe(0);
    expect(saveButton().disabled).toBe(true);
    expect(host.querySelector('.field-error')?.textContent).toContain('hh:mm');
  });

  it('rejects hours in the wrong format', () => {
    setup({ personId: 'p-1', openHours: { hours: 12, minutes: 30 }, hourlyRate: 15 });
    const hours = fixture.componentInstance.form.controls.payedHours;

    hours.setValue('12:60');
    expect(hours.valid).toBe(false);
    hours.setValue('abc');
    expect(hours.valid).toBe(false);
    hours.setValue('0:00');
    expect(hours.valid).toBe(false);
    hours.setValue('7:15');
    expect(hours.valid).toBe(true);
  });

  it('requires an amount greater than 0 and a tip of at least 0', () => {
    setup({ personId: 'p-1', openHours: { hours: 12, minutes: 30 }, hourlyRate: 15 });
    const controls = fixture.componentInstance.form.controls;

    controls.payedMoney.setValue(0);
    expect(controls.payedMoney.valid).toBe(false);
    controls.payedMoney.setValue(0.01);
    expect(controls.payedMoney.valid).toBe(true);
    controls.payedTip.setValue(-1);
    expect(controls.payedTip.valid).toBe(false);
    controls.payedTip.setValue(0);
    expect(controls.payedTip.valid).toBe(true);
  });

  it('edits a payment with its values', () => {
    setup({ personId: 'p-1', openHours: { hours: 12, minutes: 30 }, hourlyRate: 15, payment });

    expect(fixture.componentInstance.form.getRawValue()).toEqual({ payedHours: '20:00', payedMoney: 300, payedTip: 20, notes: 'bar' });
    expect(host.textContent).toContain('Zahlung bearbeiten');

    saveButton().click();

    expect(context.updatePayment).toHaveBeenCalledWith('p-1', 'pay-1', { payedHours: '20:00:00', payedMoney: 300, payedTip: 20, notes: 'bar' });
    expect(context.addPayment).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
