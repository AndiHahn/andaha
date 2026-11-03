import { mapPersonDtoRawList } from 'src/app/api/work/dtos/PersonDto';
import { of, throwError } from 'rxjs';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { ContextService } from 'src/app/core/context.service';
import { PersonContextService } from './person-context.service';

describe('PersonContextService downloadPersonInformations', () => {
  it('emits even when the result is produced synchronously', () => {
    const api = {
      listPersons: () => of([]),
      export: () => of({ body: null, headers: undefined } as any)
    } as unknown as PersonApiService;
    const service = new PersonContextService(
      { backendReady: () => of(false) } as unknown as ContextService,
      api);

    let emissions = 0;
    service.downloadPersonInformations().subscribe(() => emissions++);

    expect(emissions).toBe(1);
  });
});

describe('PersonContextService addPayment', () => {
  const rawPerson = (payedHours: string) => ({
    id: 'p1', name: 'Anna', hourlyRate: 10, totalHours: '10:00:00', payedHours, payments: []
  });

  it('refetches persons and does not add hours locally', () => {
    let calls = 0;
    const api = {
      listPersons: () => of(mapPersonDtoRawList([rawPerson(++calls == 1 ? '00:00:00' : '05:00:00')])),
      payPerson: () => of(void 0)
    } as unknown as PersonApiService;
    const service = new PersonContextService(
      { backendReady: () => of(false) } as unknown as ContextService,
      api);

    let emissions = 0;
    service.addPayment('p1', { payedHours: '02:00:00' } as any).subscribe(() => emissions++);

    expect(emissions).toBe(1);
    expect(calls).toBe(2);
    expect(service.getById('p1')!.payedHours).toEqual({ hours: 5, minutes: 0 });
  });

  it('addPayment succeeds when payment is saved but refetch fails', () => {
    let calls = 0;
    const api = {
      listPersons: () => ++calls == 1 ? of(mapPersonDtoRawList([rawPerson('00:00:00')])) : throwError(() => new Error('offline')),
      payPerson: () => of(void 0)
    } as unknown as PersonApiService;
    const service = new PersonContextService(
      { backendReady: () => of(false) } as unknown as ContextService,
      api);

    let emissions = 0;
    let errors = 0;
    service.addPayment('p1', { payedHours: '02:00:00' } as any).subscribe({ next: () => emissions++, error: () => errors++ });

    expect(calls).toBe(2);
    expect(emissions).toBe(1);
    expect(errors).toBe(0);
  });
});
