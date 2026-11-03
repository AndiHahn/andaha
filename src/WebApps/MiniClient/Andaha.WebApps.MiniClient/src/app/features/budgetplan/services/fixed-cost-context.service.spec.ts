import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { FixedCostApiService } from 'src/app/api/budgetplan/fixedcost-api.service';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { ContextService } from 'src/app/core/context.service';
import { FixedCostContextService } from './fixed-cost-context.service';

describe('FixedCostContextService byId', () => {
  let listRequest: Subject<FixedCostDto[]>;
  let backendReady: BehaviorSubject<boolean>;
  let api: jasmine.SpyObj<FixedCostApiService>;

  const cost = { id: 'f1', name: 'Rent', value: 1 } as unknown as FixedCostDto;

  function createService(): FixedCostContextService {
    const contextService = jasmine.createSpyObj<ContextService>('ContextService', ['backendReady']);
    contextService.backendReady.and.returnValue(backendReady.asObservable());
    return new FixedCostContextService(contextService, api);
  }

  beforeEach(() => {
    backendReady = new BehaviorSubject<boolean>(false);
    listRequest = new Subject<FixedCostDto[]>();
    api = jasmine.createSpyObj<FixedCostApiService>('FixedCostApiService', ['list']);
    api.list.and.returnValue(listRequest.asObservable());
  });

  it('waits for the initial load', () => {
    const service = createService();
    const emissions: (FixedCostDto | undefined)[] = [];
    let completed = false;

    service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
    expect(emissions.length).toBe(0);

    listRequest.next([cost]);

    expect(emissions).toEqual([cost]);
    expect(completed).toBeTrue();
  });

  it('emits undefined when the initial load fails', () => {
    backendReady.next(true);
    api.list.and.returnValue(throwError(() => new Error('offline')));
    const service = createService();
    let result: FixedCostDto | undefined = cost;
    let emitted = false;

    service.byId('f1').subscribe(c => { emitted = true; result = c; });

    expect(emitted).toBeTrue();
    expect(result).toBeUndefined();
  });

  it('ignores a failure before the backend is ready and waits for the refetch', () => {
    api.list.and.returnValues(throwError(() => new Error('not ready')), of([cost]));
    const service = createService();
    const emissions: (FixedCostDto | undefined)[] = [];

    service.byId('f1').subscribe(c => emissions.push(c));
    expect(emissions.length).toBe(0);

    backendReady.next(true);

    expect(emissions).toEqual([cost]);
  });

  it('emits undefined after 10 s when offline and nothing loads', fakeAsync(() => {
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    const service = createService();
    const emissions: (FixedCostDto | undefined)[] = [];
    let completed = false;

    service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
    tick(9999);
    expect(emissions.length).toBe(0);

    tick(1);

    expect(emissions).toEqual([undefined]);
    expect(completed).toBeTrue();
  }));

  it('emits undefined after 45 s when online and nothing loads', fakeAsync(() => {
    const service = createService();
    const emissions: (FixedCostDto | undefined)[] = [];
    let completed = false;

    service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
    tick(44999);
    expect(emissions.length).toBe(0);

    tick(1);

    expect(emissions).toEqual([undefined]);
    expect(completed).toBeTrue();
  }));

  it('emits undefined for an unknown id', () => {
    const service = createService();
    let result: FixedCostDto | undefined = cost;
    let emitted = false;
    listRequest.next([cost]);

    service.byId('nope').subscribe(c => { emitted = true; result = c; });

    expect(emitted).toBeTrue();
    expect(result).toBeUndefined();
  });
});
