import { Subject } from 'rxjs';
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
    cacheService.getBillsToSync.and.returnValue([]);

    service = new BillContextService(billApi, contextService, cacheService);
    service.bills().subscribe(b => currentBills = b);
    service.loading().subscribe(l => loadingValues.push(l));
  });

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
