import type { MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { SearchBillsParameters } from 'src/app/api/shopping/dtos/SearchBillsParameters';
import { PagedResultDto } from 'src/app/api/common-dtos/PagedResultDto';
import { BillSearchResultDto } from 'src/app/api/shopping/dtos/BillSearchResultDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCacheService } from './bill-cache.service';
import { BillContextService } from './bill-context.service';

// inject()-Migration: Abhaengigkeiten kommen per TestBed, die Instanz wird wie vorher direkt erzeugt
function createBillContextService(billApi: unknown, contextService: unknown, cacheService: unknown): BillContextService {
    TestBed.configureTestingModule({
        providers: [
            { provide: BillApiService, useValue: billApi },
            { provide: ContextService, useValue: contextService },
            { provide: BillCacheService, useValue: cacheService }
        ]
    });
    return TestBed.runInInjectionContext(() => new BillContextService());
}

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
    let backendReady: Subject<boolean>;
    let retryWakeUp: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        requests = [];
        parameters = [];
        currentBills = [];
        loadingValues = [];
        backendReady = new Subject<boolean>();
        retryWakeUp = vi.fn();

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
            backendUnreachable: () => false,
            backendReady: vi.fn().mockName("ContextService.backendReady"),
            retryWakeUp
        };
        contextService.backendReady.mockReturnValue(backendReady);

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = createBillContextService(billApi as unknown as BillApiService, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
        service.bills().subscribe(b => currentBills = b);
        service.loading().subscribe(l => loadingValues.push(l));
    });

    it('refreshBills reloads the first page and replaces the list', () => {
        answerInitialRequest(120);

        service.searchBills();
        requests[requests.length - 1].next({ values: [createBill('p0', 3)], totalCount: 120 });
        service.fetchNextBills();
        requests[requests.length - 1].next({ values: [createBill('p1', 2)], totalCount: 120 });
        expect(currentBills.map(b => b.id)).toEqual(['p0', 'p1']);

        service.refreshBills();
        expect(parameters[parameters.length - 1].pageIndex).toBe(0);
        expect(currentBills.map(b => b.id)).toEqual(['p0', 'p1']);

        requests[requests.length - 1].next({ values: [createBill('fresh', 4), createBill('p0', 3)], totalCount: 2 });

        expect(currentBills.map(b => b.id)).toEqual(['fresh', 'p0']);
    });

    it('exposes an error after a failed load and retry reloads', () => {
        answerInitialRequest();
        backendReady.next(true);
        expect(service.error()).toBe(false);

        requests[requests.length - 1].error(new Error('500'));
        expect(service.error()).toBe(true);

        const count = requests.length;
        service.retry();
        expect(requests.length).toBe(count + 1);
        expect(service.error()).toBe(false);
    });

    it('a failed load before the backend is ready is no error; retry wakes the backend', () => {
        requests[0].error(new Error('0'));
        expect(service.error()).toBe(false);

        service.retry();
        expect(retryWakeUp).toHaveBeenCalled();
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

    it('bill search exposes monthSums', () => {
        let monthSums = new Map<string, number>();
        service.monthSums$.subscribe(m => monthSums = m);
        answerInitialRequest();

        service.setCategoryFilter(['c1']);
        service.searchBills();
        (requests[requests.length - 1] as Subject<unknown>).next({
            values: [createBill('b1', 2)],
            totalCount: 126,
            totalSum: 1234.5,
            monthSums: [{ month: '2024-02', sum: 34.5 }, { month: '2024-01', sum: 1200 }]
        });

        expect(Array.from(monthSums.entries())).toEqual([['2024-02', 34.5], ['2024-01', 1200]]);
    });

    it('a search without matches exposes no months', () => {
        let monthSums = new Map<string, number>([['x', 1]]);
        service.monthSums$.subscribe(m => monthSums = m);

        (requests[0] as Subject<unknown>).next({ values: [], totalCount: 0, totalSum: 0, monthSums: [] });

        expect(monthSums.size).toBe(0);
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
        billApi.searchBills.mockReturnValue(of({ values: [], totalCount: 0, totalSum: 0, monthSums: [] }));

        const contextService = {
            backendUnreachable: () => false,
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

        service = createBillContextService(billApi, contextService as unknown as ContextService, cacheService);
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

    it('lastAddedId marks the saved bill for about 2 s, then clears', async () => {
        const values: (string | null)[] = [];
        service.lastAddedId().subscribe(id => values.push(id));

        await service.addBill(createDto('n1'), category);
        expect(values).toEqual([null, 'n1']);

        await vi.advanceTimersByTimeAsync(2999);
        expect(values.at(-1)).toBe('n1');
        await vi.advanceTimersByTimeAsync(1);
        expect(values.at(-1)).toBeNull();
    });

    it('showAddedBill lists and marks a bill saved directly at the server, without local save', async () => {
        const values: (string | null)[] = [];
        service.lastAddedId().subscribe(id => values.push(id));

        service.showAddedBill(createDto('n1'), category);

        expect(currentBills.map(b => b.id)).toEqual(['n1']);
        expect(totalResults).toBe(1);
        expect(values).toEqual([null, 'n1']);
        expect(cacheService.saveNewBillLocal).not.toHaveBeenCalled();
    });

    it('lastAddedId stays empty when the local save fails', async () => {
        const values: (string | null)[] = [];
        service.lastAddedId().subscribe(id => values.push(id));
        cacheService.saveNewBillLocal.mockRejectedValue(new Error('quota'));

        await expect(service.addBill(createDto('n1'), category)).rejects.toThrow();
        expect(values).toEqual([null]);
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
        billApi.searchBills.mockReturnValue(new Subject<BillSearchResultDto>().asObservable());

        const contextService = {
            backendUnreachable: () => false,
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = createBillContextService(billApi, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
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
        billApi.searchBills.mockReturnValue(new Subject<BillSearchResultDto>().asObservable());

        const contextService = {
            backendUnreachable: () => false,
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(new Subject<boolean>());

        const cacheService = {
            billAdded: vi.fn().mockName("BillCacheService.billAdded"),
            getBillsToSync: vi.fn().mockName("BillCacheService.getBillsToSync")
        };
        cacheService.billAdded.mockReturnValue(new Subject<void>());
        cacheService.getBillsToSync.mockResolvedValue([]);

        service = createBillContextService(billApi, contextService as unknown as ContextService, cacheService as unknown as BillCacheService);
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
