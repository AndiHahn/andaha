import { appendKey, formatAmount, parseAmount } from './amount-input';

describe('appendKey', () => {
  it('appends digits', () => {
    expect(appendKey('', '1')).toBe('1');
    expect(appendKey('1', '2')).toBe('12');
  });
  it('turns a leading comma into 0,', () => {
    expect(appendKey('', ',')).toBe('0,');
  });
  it('allows only one comma', () => {
    expect(appendKey('12,', ',')).toBe('12,');
    expect(appendKey('12,5', ',')).toBe('12,5');
  });
  it('limits to two decimals', () => {
    expect(appendKey('12,50', '1')).toBe('12,50');
    expect(appendKey('12,5', '0')).toBe('12,50');
  });
  it('limits to seven integer digits', () => {
    expect(appendKey('1234567', '8')).toBe('1234567');
    expect(appendKey('1234567', ',')).toBe('1234567,');
  });
  it('has no leading zeros', () => {
    expect(appendKey('0', '0')).toBe('0');
    expect(appendKey('0', '7')).toBe('7');
    expect(appendKey('', '0')).toBe('0');
    expect(appendKey('', '0')).toBe('0');
    expect(appendKey('0,', '0')).toBe('0,0');
  });
  it('deletes the last char', () => {
    expect(appendKey('12,5', 'del')).toBe('12,');
    expect(appendKey('1', 'del')).toBe('');
    expect(appendKey('', 'del')).toBe('');
  });
});

describe('parseAmount', () => {
  it('parses dot and comma decimals', () => {
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount('12')).toBe(12);
    expect(parseAmount('12,')).toBe(12);
  });
  it('parses thousands separators with comma decimals', () => {
    expect(parseAmount('1.234,50')).toBe(1234.5);
  });
  it('rejects 1,234.50 and 1,234', () => {
    expect(parseAmount('1,234.50')).toBeNull();
    expect(parseAmount('1,234')).toBeNull();
  });
  it('rejects more than two decimals, including 1.234', () => {
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('1,234')).toBeNull();
    expect(parseAmount('0,001')).toBeNull();
  });
  it('rejects zero, negatives, empty and garbage', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('0,00')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount(',')).toBeNull();
  });
});

describe('formatAmount', () => {
  it('formats with comma and two decimals', () => {
    expect(formatAmount(12.5)).toBe('12,50');
    expect(formatAmount(3)).toBe('3,00');
    expect(formatAmount(1234.5)).toBe('1234,50');
  });
});
