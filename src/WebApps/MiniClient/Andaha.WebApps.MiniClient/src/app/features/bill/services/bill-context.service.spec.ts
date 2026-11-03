import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { SearchBillsParameters } from 'src/app/api/shopping/dtos/SearchBillsParameters';
import { PagedResultDto } from 'src/app/api/common-dtos/PagedResultDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCacheService } from './bill-cache.service';
import { BillContextService } from './bill-context.service';

function createBill(id: string, day: number): BillDto {
  return {
    id,
    category: { id: 'c1', name: 'Food', color: '#000000', order: 0 },
    shopName: id,
    price: 1,
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: false,
    date: new Date(2024, 0, day)
  };
}

describe('BillContextService search', () => {
  let requests: Subject<PagedResultDto<BillDto>>[];
  let parameters: SearchBillsParameters[];
  let service: BillContextService;
  let currentBills: BillDto[];
  let loadingValues: boolean[];

  beforeEach(() => {
    requests = [];
    parameters = [];
    currentBills = [];
    loadingValues = [];

    const billApi = jasmine.createSpyObj<BillApiService>('BillApiService', ['searchBills']);
    billApi.searchBills.and.callFake((p: SearchBillsParameters) => {
      const subject = new Subject<PagedResultDto<BillDto>>();
      requests.push(subject);
      parameters.push(p);
      return subject.asObservable();
    });

    const contextService = jasmine.createSpyObj<ContextService>('ContextService', ['backendReady']);
    contextService.backendReady.and.returnValue(new Subject<boolean>());

    const cacheService = jasmine.createSpyObj<BillCacheService>('BillCacheService', ['billAdded', 'getBillsToSync']);
    cacheService.billAdded.and.returnValue(new Subject<void>());
    cacheService.getBillsToSync.and.returnValue(Promise.resolve([]));

    service = new BillContextService(billApi, contextService, cacheService);
    service.bills().subscribe(b => currentBills = b);
    service.loading().subscribe(l => loadingValues.push(l));
  });

  afterEach(() => service.ngOnDestroy());

  function answerInitialRequest(totalCount = 0): void {
    requests[0].next({ values: [], totalCount });
  }

  it('ignores the response of a search that was superseded', () => {
    answerInitialRequest();

    service.setSearchText('Bil');
    service.searchBills();
    const requestA = requests[requests.length - 1];

    service.setSearchText('Billa');
    service.searchBills();
    const requestB = requests[requests.length - 1];

    requestB.next({ values: [createBill('billa', 2)], totalCount: 1 });
    requestA.next({ values: [createBill('bil', 1)], totalCount: 1 });

    expect(currentBills.map(b => b.id)).toEqual(['billa']);
  });

  it('cancels the http request of a superseded search', () => {
    answerInitialRequest();

    service.setSearchText('Bil');
    service.searchBills();
    const requestA = requests[requests.length - 1];
    expect(requestA.observers.length).toBe(1);

    service.setSearchText('Billa');
    service.searchBills();

    expect(requestA.observers.length).toBe(0);
  });

  it('keeps page results of the same search', () => {
    answerInitialRequest(120);

    service.searchBills();
    const page0 = requests[requests.length - 1];

    service.fetchNextBills();
    const page1 = requests[requests.length - 1];
    expect(page1).not.toBe(page0);
    expect(parameters[parameters.length - 1].pageIndex).toBe(1);

    page1.next({ values: [createBill('p1', 1)], totalCount: 120 });
    page0.next({ values: [createBill('p0', 2)], totalCount: 120 });

    expect(currentBills.map(b => b.id).sort()).toEqual(['p0', 'p1']);
  });

  it('stays loading while the newest search is still running', () => {
    answerInitialRequest();

    service.searchBills();
    const mark = loadingValues.length;
    service.searchBills();
    const requestB = requests[requests.length - 1];

    expect(loadingValues.slice(mark)).not.toContain(false);
    expect(loadingValues[loadingValues.length - 1]).toBeTrue();

    requestB.next({ values: [createBill('billa', 2)], totalCount: 1 });
    requestB.complete();

    expect(loadingValues[loadingValues.length - 1]).toBeFalse();
  });

  it('stays loading while another page request of the same search is pending', () => {
    answerInitialRequest(120);

    service.searchBills();
    const page0 = requests[requests.length - 1];
    service.fetchNextBills();
    const page1 = requests[requests.length - 1];

    const mark = loadingValues.length;
    page0.next({ values: [createBill('p0', 2)], totalCount: 120 });
    page0.complete();

    expect(loadingValues.slice(mark)).not.toContain(false);
    expect(loadingValues[loadingValues.length - 1]).toBeTrue();

    page1.next({ values: [createBill('p1', 1)], totalCount: 120 });
    page1.complete();

    expect(loadingValues[loadingValues.length - 1]).toBeFalse();
  });

  it('starts a new generation on page size change', () => {
    const initialRequest = requests[0];
    expect(initialRequest.observers.length).toBe(1);

    service.setPageSize(100);

    expect(initialRequest.observers.length).toBe(0);
    expect(requests.length).toBe(2);
    expect(parameters[1].pageSize).toBe(100);
  });
});

describe('BillContextService local save and sync', () => {
  let billApi: jasmine.SpyObj<BillApiService>;
  let cacheService: jasmine.SpyObj<BillCacheService>;
  let billAdded: Subject<void>;
  let service: BillContextService;
  let syncingValues: boolean[];
  let currentBills: BillDto[];
  let totalResults: number;
  let pending: BillCreateDto[];

  const category = { id: 'c1', name: 'Food', color: '#000000', order: 0 };

  function createDto(id: string): BillCreateDto {
    return { id, shopName: id, categoryId: 'c1', price: 1, date: new Date(2024, 0, 2) };
  }

  function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  beforeEach(() => {
    syncingValues = [];
    currentBills = [];
    totalResults = 0;
    pending = [createDto('p1')];

    billApi = jasmine.createSpyObj<BillApiService>('BillApiService', ['searchBills', 'addBill']);
    billApi.searchBills.and.returnValue(of({ values: [], totalCount: 0 }));

    const contextService = jasmine.createSpyObj<ContextService>('ContextService', ['backendReady']);
    contextService.backendReady.and.returnValue(new Subject<boolean>());

    billAdded = new Subject<void>();
    cacheService = jasmine.createSpyObj<BillCacheService>('BillCacheService',
      ['billAdded', 'getBillsToSync', 'saveNewBillLocal', 'removeBillLocal']);
    cacheService.billAdded.and.returnValue(billAdded);
    cacheService.getBillsToSync.and.callFake(() => Promise.resolve([...pending]));
    cacheService.saveNewBillLocal.and.returnValue(Promise.resolve());
    cacheService.removeBillLocal.and.callFake(id => { pending = pending.filter(b => b.id !== id); return Promise.resolve(); });

    service = new BillContextService(billApi, contextService, cacheService);
    service.syncing().subscribe(s => syncingValues.push(s));
    service.bills().subscribe(b => currentBills = b);
    service.totalResults().subscribe(t => totalResults = t);
  });

  afterEach(() => service.ngOnDestroy());

  it('addBill removes bill from list and rejects when local save fails', async () => {
    cacheService.saveNewBillLocal.and.returnValue(Promise.reject(new Error('quota')));

    await expectAsync(service.addBill(createDto('n1'), category)).toBeRejected();

    expect(currentBills.map(b => b.id)).toEqual([]);
    expect(totalResults).toBe(0);
  });

  it('addBill keeps bill in list when local save succeeds', async () => {
    await service.addBill(createDto('n1'), category);

    expect(currentBills.map(b => b.id)).toEqual(['n1']);
    expect(totalResults).toBe(1);
  });

  it('sync failure resets syncing', async () => {
    billApi.addBill.and.returnValue(throwError(() => new Error('500')));

    window.dispatchEvent(new Event('online'));
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(1);
    expect(syncingValues[syncingValues.length - 1]).toBeFalse();
    expect(syncingValues).toContain(true);
    expect(cacheService.removeBillLocal).not.toHaveBeenCalled();
  });

  it('successful sync removes local entry and reloads the list', async () => {
    billApi.addBill.and.returnValue(of(createBill('p1', 1)));
    const searchCalls = billApi.searchBills.calls.count();

    window.dispatchEvent(new Event('online'));
    await flush();

    expect(cacheService.removeBillLocal).toHaveBeenCalledWith('p1');
    expect(syncingValues[syncingValues.length - 1]).toBeFalse();
    expect(billApi.searchBills.calls.count()).toBe(searchCalls + 1);
  });

  it('concurrent sync triggers post each bill once', async () => {
    const response = new Subject<BillDto>();
    billApi.addBill.and.returnValue(response.asObservable());

    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(1);

    response.next(createBill('p1', 1));
    response.complete();
    await flush();

    expect(syncingValues[syncingValues.length - 1]).toBeFalse();
  });

  it('retries on online event after a failure', async () => {
    billApi.addBill.and.returnValue(throwError(() => new Error('offline')));

    window.dispatchEvent(new Event('online'));
    await flush();
    window.dispatchEvent(new Event('online'));
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(2);
  });

  it('re-runs once after the run when online fires mid-run and the first POST fails', async () => {
    const first = new Subject<BillDto>();
    billApi.addBill.and.returnValues(first.asObservable(), throwError(() => new Error('offline')));

    window.dispatchEvent(new Event('online'));
    await flush();
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    await flush();
    expect(billApi.addBill).toHaveBeenCalledTimes(1);

    first.error(new Error('500'));
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(2);
  });

  it('retries when the page becomes visible', async () => {
    billApi.addBill.and.returnValue(throwError(() => new Error('offline')));
    spyOnProperty(document, 'visibilityState').and.returnValue('visible');

    document.dispatchEvent(new Event('visibilitychange'));
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(1);
  });

  it('does not sync when the page becomes hidden', async () => {
    spyOnProperty(document, 'visibilityState').and.returnValue('hidden');

    document.dispatchEvent(new Event('visibilitychange'));
    await flush();

    expect(billApi.addBill).not.toHaveBeenCalled();
  });

  it('syncs a bill added while a sync is running afterwards', async () => {
    const first = new Subject<BillDto>();
    billApi.addBill.and.returnValues(first.asObservable(), of(createBill('p2', 1)));

    window.dispatchEvent(new Event('online'));
    await flush();
    pending = [createDto('p2')];
    billAdded.next();
    await flush();
    expect(billApi.addBill).toHaveBeenCalledTimes(1);

    first.next(createBill('p1', 1));
    first.complete();
    await flush();

    expect(billApi.addBill).toHaveBeenCalledTimes(2);
  });

  it('hung sync request times out and releases the sync lock', fakeAsync(() => {
    billApi.addBill.and.returnValues(new Subject<BillDto>().asObservable(), of(createBill('p1', 1)));

    window.dispatchEvent(new Event('online'));
    flushMicrotasks();
    expect(billApi.addBill).toHaveBeenCalledTimes(1);
    expect(syncingValues[syncingValues.length - 1]).toBeTrue();

    tick(60000);
    flushMicrotasks();

    expect(syncingValues[syncingValues.length - 1]).toBeFalse();
    expect(cacheService.removeBillLocal).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('online'));
    flushMicrotasks();

    expect(billApi.addBill).toHaveBeenCalledTimes(2);
  }));
});

describe('BillContextService loadBillById', () => {
  let billApi: jasmine.SpyObj<BillApiService>;
  let service: BillContextService;

  beforeEach(() => {
    billApi = jasmine.createSpyObj<BillApiService>('BillApiService', ['searchBills', 'getBill']);
    billApi.searchBills.and.returnValue(new Subject<PagedResultDto<BillDto>>().asObservable());

    const contextService = jasmine.createSpyObj<ContextService>('ContextService', ['backendReady']);
    contextService.backendReady.and.returnValue(new Subject<boolean>());

    const cacheService = jasmine.createSpyObj<BillCacheService>('BillCacheService', ['billAdded', 'getBillsToSync']);
    cacheService.billAdded.and.returnValue(new Subject<void>());
    cacheService.getBillsToSync.and.returnValue(Promise.resolve([]));

    service = new BillContextService(billApi, contextService, cacheService);
  });

  afterEach(() => service.ngOnDestroy());

  it('falls back to api when the bill is not in the loaded list', () => {
    billApi.getBill.and.returnValue(of(createBill('b1', 1)));
    let result: BillDto | undefined;

    service.loadBillById('b1').subscribe(b => result = b);

    expect(billApi.getBill).toHaveBeenCalledWith('b1');
    expect(result?.id).toBe('b1');
  });

  it('emits undefined on 404', () => {
    billApi.getBill.and.returnValue(throwError(() => ({ status: 404 })));
    let emitted = false;
    let result: BillDto | undefined = createBill('x', 1);

    service.loadBillById('b1').subscribe(b => { emitted = true; result = b; });

    expect(emitted).toBeTrue();
    expect(result).toBeUndefined();
  });
});

describe('BillContextService updateBill', () => {
  let billApi: jasmine.SpyObj<BillApiService>;
  let service: BillContextService;

  beforeEach(() => {
    billApi = jasmine.createSpyObj<BillApiService>('BillApiService', ['searchBills', 'updateBill']);
    billApi.searchBills.and.returnValue(new Subject<PagedResultDto<BillDto>>().asObservable());

    const contextService = jasmine.createSpyObj<ContextService>('ContextService', ['backendReady']);
    contextService.backendReady.and.returnValue(new Subject<boolean>());

    const cacheService = jasmine.createSpyObj<BillCacheService>('BillCacheService', ['billAdded', 'getBillsToSync']);
    cacheService.billAdded.and.returnValue(new Subject<void>());
    cacheService.getBillsToSync.and.returnValue(Promise.resolve([]));

    service = new BillContextService(billApi, contextService, cacheService);
  });

  afterEach(() => service.ngOnDestroy());

  const updateDto = { categoryId: 'c2', shopName: 'Neu', price: 99, date: new Date(2024, 5, 5), notes: 'n' };
  const newCategory = { id: 'c2', name: 'Other', color: '#ffffff', order: 1 };

  it('updateBill restores previous values on error', () => {
    const bill = createBill('b1', 1);
    (service as any).bills$.next([bill]);
    billApi.updateBill.and.returnValue(throwError(() => new Error('fail')));
    let failed = false;

    service.updateBill('b1', updateDto, false, newCategory).subscribe({ error: () => failed = true });

    expect(failed).toBeTrue();
    expect(bill.shopName).toBe('b1');
    expect(bill.price).toBe(1);
    expect(bill.category.id).toBe('c1');
    expect(bill.date).toEqual(new Date(2024, 0, 1));
    expect(bill.notes).toBeUndefined();
  });

  it('updateBill propagates the error when the bill is not in the list', () => {
    billApi.updateBill.and.returnValue(throwError(() => new Error('fail')));
    let failed = false;

    service.updateBill('unknown', updateDto, false, newCategory).subscribe({ error: () => failed = true });

    expect(failed).toBeTrue();
  });
});
