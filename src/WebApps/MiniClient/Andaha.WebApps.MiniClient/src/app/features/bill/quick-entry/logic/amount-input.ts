export type AmountKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'del';

const MAX_INTEGER_DIGITS = 7;
const MAX_DECIMALS = 2;

export function appendKey(current: string, key: AmountKey): string {
  if (key === 'del') {
    return current.slice(0, -1);
  }
  const commaIndex = current.indexOf(',');
  if (key === ',') {
    if (commaIndex >= 0) {
      return current;
    }
    return current === '' ? '0,' : current + ',';
  }
  if (commaIndex >= 0) {
    return current.length - commaIndex - 1 >= MAX_DECIMALS ? current : current + key;
  }
  if (current === '0') {
    return key;
  }
  return current.length >= MAX_INTEGER_DIGITS ? current : current + key;
}

// Erlaubt: "12", "12,", "12,5", "12.5", "1.234,50". Ungueltig: "1,234.50", "1,234", "1.234" (drei Nachkommastellen).
const COMMA_FORMAT = /^(\d+|\d{1,3}(?:\.\d{3})+),(\d{0,2})$/;
const DOT_FORMAT = /^\d+(?:\.\d{1,2})?$/;

export function parseAmount(text: string): number | null {
  const value = text.trim();
  let normalized: string;
  const comma = COMMA_FORMAT.exec(value);
  if (comma) {
    normalized = `${comma[1].replace(/\./g, '')}.${comma[2] || '0'}`;
  } else if (DOT_FORMAT.test(value)) {
    normalized = value;
  } else {
    return null;
  }
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function formatAmount(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
