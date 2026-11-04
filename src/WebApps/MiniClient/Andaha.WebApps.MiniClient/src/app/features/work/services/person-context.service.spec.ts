import { mapPersonDtoRawList } from 'src/app/api/work/dtos/PersonDto';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { ContextService } from 'src/app/core/context.service';
import { PersonContextService } from './person-context.service';

// inject()-Migration: Abhaengigkeiten kommen per TestBed, die Instanz wird wie vorher direkt erzeugt
function createPersonContextService(api: PersonApiService): PersonContextService {
  TestBed.configureTestingModule({
    providers: [
      { provide: ContextService, useValue: { backendReady: () => of(false) } },
      { provide: PersonApiService, useValue: api }
    ]
  });
  return TestBed.runInInjectionContext(() => new PersonContextService());
}

describe('PersonContextService downloadPersonInformations', () => {
  it('emits even when the result is produced synchronously', () => {
    const api = {
      listPersons: () => of([]),
      export: () => of({ body: null, headers: undefined } as any)
    } as unknown as PersonApiService;
    const service = createPersonContextService(api);

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
    const service = createPersonContextService(api);

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
    const service = createPersonContextService(api);

    let emissions = 0;
    let errors = 0;
    service.addPayment('p1', { payedHours: '02:00:00' } as any).subscribe({ next: () => emissions++, error: () => errors++ });

    expect(calls).toBe(2);
    expect(emissions).toBe(1);
    expect(errors).toBe(0);
  });
});
