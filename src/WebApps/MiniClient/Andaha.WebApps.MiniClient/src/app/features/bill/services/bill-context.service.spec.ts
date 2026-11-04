import type { MockedObject } from "vitest";
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

        const billApi = {
            searchBills: vi.fn().mockName("BillApiService.searchBills")
        };
        billApi.searchBills.mockImplementation((p: SearchBillsParameters) => {
            const subject = new Subject<PagedResultDto<BillDto>>();
            requests.push(subject);
            parameters.push(p);
            return subject.asObservable();
        });

        const contextService = {
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = new BillContextService(billApi as unknown as BillApiService, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
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
        expect(loadingValues[loadingValues.length - 1]).toBe(true);

        requestB.next({ values: [createBill('billa', 2)], totalCount: 1 });
        requestB.complete();

        expect(loadingValues[loadingValues.length - 1]).toBe(false);
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
        expect(loadingValues[loadingValues.length - 1]).toBe(true);

        page1.next({ values: [createBill('p1', 1)], totalCount: 120 });
        page1.complete();

        expect(loadingValues[loadingValues.length - 1]).toBe(false);
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
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let billApi: MockedObject<BillApiService>;
    let cacheService: MockedObject<BillCacheService>;
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

    async function flush(): Promise<void> {
        await vi.advanceTimersByTimeAsync(0);
    }

    beforeEach(() => {
        syncingValues = [];
        currentBills = [];
        totalResults = 0;
        pending = [createDto('p1')];

        billApi = {
            searchBills: vi.fn().mockName("BillApiService.searchBills"),
            addBill: vi.fn().mockName("BillApiService.addBill")
        } as unknown as MockedObject<BillApiService>;
        billApi.searchBills.mockReturnValue(of({ values: [], totalCount: 0 }));

        const contextService = {
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        billAdded = new Subject<void>();
        cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync"),
            saveNewBillLocal: vi.fn().mockName("BillCacheService.saveNewBillLocal"),
            removeBillLocal: vi.fn().mockName("BillCacheService.removeBillLocal")
        } as unknown as MockedObject<BillCacheService>;
        cacheService.billAdded.mockReturnValue(billAdded);
        cacheService.getBillsToSync.mockImplementation(() => Promise.resolve([...pending]));
        cacheService.saveNewBillLocal.mockResolvedValue();
        cacheService.removeBillLocal.mockImplementation(id => { pending = pending.filter(b => b.id !== id); return Promise.resolve(); });

        service = new BillContextService(billApi, contextService as unknown as ContextService, cacheService);
        service.syncing().subscribe(s => syncingValues.push(s));
        service.bills().subscribe(b => currentBills = b);
        service.totalResults().subscribe(t => totalResults = t);
    });

    afterEach(() => service.ngOnDestroy());

    it('addBill removes bill from list and rejects when local save fails', async () => {
        cacheService.saveNewBillLocal.mockRejectedValue(new Error('quota'));

        await expect(service.addBill(createDto('n1'), category)).rejects.toThrow();

        expect(currentBills.map(b => b.id)).toEqual([]);
        expect(totalResults).toBe(0);
    });

    it('addBill keeps bill in list when local save succeeds', async () => {
        await service.addBill(createDto('n1'), category);

        expect(currentBills.map(b => b.id)).toEqual(['n1']);
        expect(totalResults).toBe(1);
    });

    it('sync failure resets syncing', async () => {
        billApi.addBill.mockReturnValue(throwError(() => new Error('500')));

        window.dispatchEvent(new Event('online'));
        await flush();

        expect(billApi.addBill).toHaveBeenCalledTimes(1);
        expect(syncingValues[syncingValues.length - 1]).toBe(false);
        expect(syncingValues).toContain(true);
        expect(cacheService.removeBillLocal).not.toHaveBeenCalled();
    });

    it('successful sync removes local entry and reloads the list', async () => {
        billApi.addBill.mockReturnValue(of(createBill('p1', 1)));
        const searchCalls = vi.mocked(billApi.searchBills).mock.calls.length;

        window.dispatchEvent(new Event('online'));
        await flush();

        expect(cacheService.removeBillLocal).toHaveBeenCalledWith('p1');
        expect(syncingValues[syncingValues.length - 1]).toBe(false);
        expect(vi.mocked(billApi.searchBills).mock.calls.length).toBe(searchCalls + 1);
    });

    it('concurrent sync triggers post each bill once', async () => {
        const response = new Subject<BillDto>();
        billApi.addBill.mockReturnValue(response.asObservable());

        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('online'));
        await flush();

        expect(billApi.addBill).toHaveBeenCalledTimes(1);

        response.next(createBill('p1', 1));
        response.complete();
        await flush();

        expect(syncingValues[syncingValues.length - 1]).toBe(false);
    });

    it('retries on online event after a failure', async () => {
        billApi.addBill.mockReturnValue(throwError(() => new Error('offline')));

        window.dispatchEvent(new Event('online'));
        await flush();
        window.dispatchEvent(new Event('online'));
        await flush();

        expect(billApi.addBill).toHaveBeenCalledTimes(2);
    });

    it('re-runs once after the run when online fires mid-run and the first POST fails', async () => {
        const first = new Subject<BillDto>();
        billApi.addBill.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(throwError(() => new Error('offline')));

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
        billApi.addBill.mockReturnValue(throwError(() => new Error('offline')));
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

        document.dispatchEvent(new Event('visibilitychange'));
        await flush();

        expect(billApi.addBill).toHaveBeenCalledTimes(1);
    });

    it('does not sync when the page becomes hidden', async () => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

        document.dispatchEvent(new Event('visibilitychange'));
        await flush();

        expect(billApi.addBill).not.toHaveBeenCalled();
    });

    it('syncs a bill added while a sync is running afterwards', async () => {
        const first = new Subject<BillDto>();
        billApi.addBill.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(of(createBill('p2', 1)));

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

    it('hung sync request times out and releases the sync lock', async () => {
        billApi.addBill.mockReturnValueOnce(new Subject<BillDto>().asObservable()).mockReturnValueOnce(of(createBill('p1', 1)));

        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(0);
        expect(billApi.addBill).toHaveBeenCalledTimes(1);
        expect(syncingValues[syncingValues.length - 1]).toBe(true);

        await vi.advanceTimersByTimeAsync(60000);
        await vi.advanceTimersByTimeAsync(0);

        expect(syncingValues[syncingValues.length - 1]).toBe(false);
        expect(cacheService.removeBillLocal).not.toHaveBeenCalled();

        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(0);

        expect(billApi.addBill).toHaveBeenCalledTimes(2);
    });
});

describe('BillContextService loadBillById', () => {
    let billApi: MockedObject<BillApiService>;
    let service: BillContextService;

    beforeEach(() => {
        billApi = {
            searchBills: vi.fn().mockName("BillApiService.searchBills"),
            getBill: vi.fn().mockName("BillApiService.getBill")
        } as unknown as MockedObject<BillApiService>;
        billApi.searchBills.mockReturnValue(new Subject<PagedResultDto<BillDto>>().asObservable());

        const contextService = {
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = new BillContextService(billApi, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
    });

    afterEach(() => service.ngOnDestroy());

    it('falls back to api when the bill is not in the loaded list', () => {
        billApi.getBill.mockReturnValue(of(createBill('b1', 1)));
        let result: BillDto | undefined;

        service.loadBillById('b1').subscribe(b => result = b);

        expect(billApi.getBill).toHaveBeenCalledWith('b1');
        expect(result?.id).toBe('b1');
    });

    it('emits undefined on 404', () => {
        billApi.getBill.mockReturnValue(throwError(() => ({ status: 404 })));
        let emitted = false;
        let result: BillDto | undefined = createBill('x', 1);

        service.loadBillById('b1').subscribe(b => { emitted = true; result = b; });

        expect(emitted).toBe(true);
        expect(result).toBeUndefined();
    });
});

describe('BillContextService updateBill', () => {
    let billApi: MockedObject<BillApiService>;
    let service: BillContextService;

    beforeEach(() => {
        billApi = {
            searchBills: vi.fn().mockName("BillApiService.searchBills"),
            updateBill: vi.fn().mockName("BillApiService.updateBill")
        } as unknown as MockedObject<BillApiService>;
        billApi.searchBills.mockReturnValue(new Subject<PagedResultDto<BillDto>>().asObservable());

        const contextService = {
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = new BillContextService(billApi, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
    });

    afterEach(() => service.ngOnDestroy());

    const updateDto = { categoryId: 'c2', shopName: 'Neu', price: 99, date: new Date(2024, 5, 5), notes: 'n' };
    const newCategory = { id: 'c2', name: 'Other', color: '#ffffff', order: 1 };

    it('updateBill restores previous values on error', () => {
        const bill = createBill('b1', 1);
        (service as any).bills$.next([bill]);
        billApi.updateBill.mockReturnValue(throwError(() => new Error('fail')));
        let failed = false;

        service.updateBill('b1', updateDto, false, newCategory).subscribe({ error: () => failed = true });

        expect(failed).toBe(true);
        expect(bill.shopName).toBe('b1');
        expect(bill.price).toBe(1);
        expect(bill.category.id).toBe('c1');
        expect(bill.date).toEqual(new Date(2024, 0, 1));
        expect(bill.notes).toBeUndefined();
    });

    it('updateBill propagates the error when the bill is not in the list', () => {
        billApi.updateBill.mockReturnValue(throwError(() => new Error('fail')));
        let failed = false;

        service.updateBill('unknown', updateDto, false, newCategory).subscribe({ error: () => failed = true });

        expect(failed).toBe(true);
    });
});
