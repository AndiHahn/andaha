import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ContextService } from '../core/context.service';
import { BillContextService } from '../features/bill/services/bill-context.service';
import { BillCategoryContextService } from './bill-category-context.service';

describe('BillCategoryContextService loading', () => {
  let http: HttpTestingController;
  let backendReady: BehaviorSubject<boolean>;

  const isCategoryList = (r: { method: string; url: string }) =>
    r.method === 'GET' && new URL(r.url).pathname.endsWith('/billcategory');

  beforeEach(() => {
    backendReady = new BehaviorSubject<boolean>(false);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => backendReady.asObservable(), retryWakeUp: vi.fn() } },
        { provide: BillContextService, useValue: { refreshBills: vi.fn() } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('categories load once on start', () => {
    TestBed.inject(BillCategoryContextService);
    expect(http.match(isCategoryList).length).toBe(0);

    backendReady.next(true);
    backendReady.next(true);

    const requests = http.match(isCategoryList);
    expect(requests.length).toBe(1);
    requests[0].flush([]);
    http.verify();
  });

  it('exposes error and retry reloads', () => {
    const service = TestBed.inject(BillCategoryContextService);
    backendReady.next(true);
    http.expectOne(isCategoryList).flush('boom', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBe(true);

    let names: string[] = [];
    service.categories().subscribe(c => names = c.map(category => category.name));
    service.retry();
    expect(service.loading()).toBe(true);
    http.expectOne(isCategoryList).flush([{ id: 'c1', name: 'Essen' }]);

    expect(service.error()).toBe(false);
    expect(service.loading()).toBe(false);
    expect(names).toEqual(['Essen']);
  });
});
