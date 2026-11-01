import { of } from 'rxjs';
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
