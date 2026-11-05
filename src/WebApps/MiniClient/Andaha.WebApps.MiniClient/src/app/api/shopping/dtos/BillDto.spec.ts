import { getRecordOfProperties } from 'src/app/shared/utils/utils';
import { BillDtoRaw, mapBillDtoRaw } from './BillDto';

function raw(date: string): BillDtoRaw {
  return {
    id: 'b1',
    category: { id: 'c1', name: 'Lebensmittel', color: 'red', order: 0, isDefault: false, subCategories: [] } as any,
    shopName: 'Billa',
    price: 12.5,
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: false,
    date
  };
}

describe('mapBillDtoRaw', () => {
  it('reads the stored bill time as local time, so 23:30 stays on its day', () => {
    // das Backend markiert die gespeicherte Ortszeit als UTC („Z“)
    const bill = mapBillDtoRaw(raw('2026-11-05T23:30:00Z'));

    expect(bill.date).toEqual(new Date(2026, 10, 5, 23, 30));
  });

  it('reads a bill without time as local midnight of its day', () => {
    const bill = mapBillDtoRaw(raw('2026-12-01T00:00:00Z'));

    expect(bill.date).toEqual(new Date(2026, 11, 1));
  });

  it('reads createdAt as a real UTC instant', () => {
    const bill = mapBillDtoRaw({ ...raw('2026-11-05T00:00:00Z'), createdAt: '2026-11-05T20:14:00Z' });

    // Testzeitzone Europe/Vienna (test-setup.ts): 20:14 UTC = 21:14 Ortszeit
    expect(bill.createdAt).toEqual(new Date(Date.UTC(2026, 10, 5, 20, 14)));
    expect(bill.createdAt!.getHours()).toBe(21);
  });

  it('runs the date specs in Europe/Vienna', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Vienna');
  });

  it('sending and reading back a bill at 23:30 local keeps day and time', () => {
    const picked = new Date(2026, 2, 29, 23, 30);
    const sent = getRecordOfProperties({ date: picked })['date'] as string;

    // der Server liefert den gespeicherten Wert mit „Z“ zurück
    expect(mapBillDtoRaw(raw(`${sent.substring(0, 19)}Z`)).date).toEqual(picked);
  });
});
