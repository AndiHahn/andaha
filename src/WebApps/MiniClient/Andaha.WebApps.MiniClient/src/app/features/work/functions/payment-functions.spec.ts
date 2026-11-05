import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { isValidPayedHours, openAmount, openHours, PAYED_HOURS_PATTERN, paymentPrefill } from './payment-functions';

function person(total: [number, number], payed: [number, number], hourlyRate = 15): PersonDto {
  return {
    id: 'p-1',
    name: 'Maria Huber',
    hourlyRate,
    totalHours: { hours: total[0], minutes: total[1] },
    payedHours: { hours: payed[0], minutes: payed[1] },
    payments: []
  };
}

describe('payment functions', () => {
  it('openHours is total minus payed hours as decimal hours', () => {
    expect(openHours(person([86, 30], [74, 0]))).toBe(12.5);
  });

  it('openHours never goes below 0', () => {
    expect(openHours(person([10, 0], [12, 30]))).toBe(0);
  });

  it('openAmount: 12:30 h × 15 € is 187,50', () => {
    expect(openAmount(person([12, 30], [0, 0], 15))).toBe(187.5);
  });

  it('openAmount is 0 when more was paid than worked', () => {
    expect(openAmount(person([10, 0], [12, 30], 15))).toBe(0);
  });

  it('openAmount is rounded to cents', () => {
    // 0:20 h × 10 € = 3,333… €
    expect(openAmount(person([0, 20], [0, 0], 10))).toBe(3.33);
  });

  it('paymentPrefill gives the open hours, the amount and tip 0', () => {
    expect(paymentPrefill(person([86, 30], [74, 0], 15))).toEqual({ payedHours: '12:30', payedMoney: 187.5, payedTip: 0 });
  });

  it('paymentPrefill pads hours to hh:mm', () => {
    expect(paymentPrefill(person([8, 5], [0, 0], 10)).payedHours).toBe('08:05');
  });

  it('paymentPrefill gives 00:00 and 0 when more was paid than worked', () => {
    expect(paymentPrefill(person([10, 0], [12, 30], 15))).toEqual({ payedHours: '00:00', payedMoney: 0, payedTip: 0 });
  });

  it('PAYED_HOURS_PATTERN accepts h:mm up to four hour digits', () => {
    expect(PAYED_HOURS_PATTERN.test('12:30')).toBe(true);
    expect(PAYED_HOURS_PATTERN.test('1234:05')).toBe(true);
    expect(PAYED_HOURS_PATTERN.test('12:60')).toBe(false);
    expect(PAYED_HOURS_PATTERN.test('abc')).toBe(false);
  });

  it('payed hours: "12:30" valid, "12:60" invalid, "abc" invalid, "0:00" invalid (greater than 0)', () => {
    expect(isValidPayedHours('12:30')).toBe(true);
    expect(isValidPayedHours('12:60')).toBe(false);
    expect(isValidPayedHours('abc')).toBe(false);
    expect(isValidPayedHours('0:00')).toBe(false);
    expect(isValidPayedHours('00:00')).toBe(false);
    expect(isValidPayedHours('0:01')).toBe(true);
  });
});
