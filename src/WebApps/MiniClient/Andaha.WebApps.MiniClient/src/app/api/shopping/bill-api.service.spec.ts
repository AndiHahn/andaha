import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BillApiService } from './bill-api.service';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { BillSearchResultDto } from './dtos/BillSearchResultDto';

describe('BillApiService addBill', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('omits fields without a value instead of sending the text "undefined"', () => {
    TestBed.inject(BillApiService).addBill({
      shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1', subCategoryId: undefined
    } as never).subscribe();
    const req = http.expectOne(r => r.method === 'POST');
    const body = req.request.body as FormData;
    expect(body.has('subCategoryId')).toBe(false);
    expect(Array.from(body.values())).not.toContain('undefined');
    expect(body.get('shopName')).toBe('Billa');
    http.verify();
  });

  it('updateBill leaves out a cleared subcategory and notes (PUT replaces the bill) and never sends "undefined"', () => {
    TestBed.inject(BillApiService).updateBill('b1', {
      shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1', subCategoryId: undefined, notes: undefined
    }).subscribe();
    const req = http.expectOne(r => r.method === 'PUT');
    const body = req.request.body as FormData;
    expect(body.has('subCategoryId')).toBe(false);
    expect(body.has('notes')).toBe(false);
    expect(Array.from(body.values())).not.toContain('undefined');
    expect(body.get('categoryId')).toBe('c1');
    http.verify();
  });

  it('addBill sets SKIP_GLOBAL_ERROR', () => {
    TestBed.inject(BillApiService).addBill({
      shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1'
    } as never).subscribe({ error: () => undefined });

    const req = http.expectOne(r => r.method === 'POST');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    http.verify();
  });

  it('searchBills maps totalSum and monthSums', () => {
    let result: BillSearchResultDto | undefined;
    TestBed.inject(BillApiService).searchBills({ pageIndex: 0, pageSize: 50 }).subscribe(r => result = r);

    http.expectOne(r => r.method === 'GET').flush({
      values: [{ id: 'b1', date: '2026-11-04T00:00:00Z' }],
      totalCount: 1,
      totalSum: 12.5,
      monthSums: [{ month: '2026-11', sum: 12.5 }]
    });

    expect(result!.values[0].date).toEqual(new Date('2026-11-04T00:00:00Z'));
    expect(result!.totalSum).toBe(12.5);
    expect(result!.monthSums).toEqual([{ month: '2026-11', sum: 12.5 }]);
  });

  it('deleteUserData calls DELETE api/bill/user-data without global error snackbar', () => {
    TestBed.inject(BillApiService).deleteUserData().subscribe();

    const req = http.expectOne(r => r.method === 'DELETE');
    expect(new URL(req.request.url).pathname).toBe('/api/bill/user-data');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
  });

  it('updateBill sends a chosen subcategory', () => {
    TestBed.inject(BillApiService).updateBill('b1', {
      shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1', subCategoryId: 's1'
    }).subscribe();
    const body = http.expectOne(r => r.method === 'PUT').request.body as FormData;
    expect(body.get('subCategoryId')).toBe('s1');
    http.verify();
  });
});
