import { getRecordOfProperties } from './utils';

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('getRecordOfProperties', () => {
  it('bill date picked today at 23:30 local is sent as that local day', () => {
    const date = new Date();
    date.setHours(23, 30, 0, 0);

    const record = getRecordOfProperties({ shopName: 'Billa', date });

    // lokale Uhrzeit ohne Zonenangabe: der Server speichert sie unverändert, der Tag bleibt
    expect(record['date']).toBe(`${localDayKey(date)}T23:30:00.000`);
    expect(record['shopName']).toBe('Billa');
  });

  it('a month first shortly after midnight is sent in its month', () => {
    const record = getRecordOfProperties({ date: new Date(2026, 11, 1, 0, 30) });

    expect(record['date']).toBe('2026-12-01T00:30:00.000');
  });
});
