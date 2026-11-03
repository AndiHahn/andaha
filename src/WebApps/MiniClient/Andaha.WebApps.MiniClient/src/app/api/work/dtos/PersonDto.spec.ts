import { mapPersonDtoRaw, PersonDtoRaw } from './PersonDto';

describe('mapPersonDtoRaw', () => {
  const base: PersonDtoRaw = {
    id: 'p', name: 'Anna', hourlyRate: 10, totalHours: '10:00:00', payedHours: '02:30:00'
  } as PersonDtoRaw;

  it('maps payments', () => {
    const dto = mapPersonDtoRaw({
      ...base,
      payments: [{ id: '1', payedAt: '2026-10-01T10:00:00Z', payedHours: '02:30:00', payedMoney: 50, payedTip: 5 }]
    });

    expect(dto.payments.length).toBe(1);
    expect(dto.payments[0].payedAt instanceof Date).toBeTrue();
    expect(dto.payments[0].payedHours).toEqual({ hours: 2, minutes: 30 });
    expect(dto.payments[0].payedMoney).toBe(50);
  });

  it('defaults payments to empty array', () => {
    expect(mapPersonDtoRaw(base).payments).toEqual([]);
  });
});
