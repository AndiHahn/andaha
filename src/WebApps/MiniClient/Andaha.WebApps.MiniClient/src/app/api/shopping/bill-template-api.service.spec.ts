import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BillApiService } from './bill-api.service';
import { BillTemplateApiService } from './bill-template-api.service';

describe('Shopping template/stats api', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectReq(method: string, pathAndQuery: string) {
    return http.expectOne(r => r.method === method && r.urlWithParams.endsWith(pathAndQuery + '?api-version=1.0'));
  }

  describe('BillTemplateApiService', () => {
    it('list: GET /api/bill-template', () => {
      const api = TestBed.inject(BillTemplateApiService);
      let result: unknown;
      api.list().subscribe(r => result = r);
      expectReq('GET', '/api/bill-template').flush([{ id: 't1' }]);
      expect(result).toEqual([{ id: 't1' }]);
    });

    it('create: POST body', () => {
      const api = TestBed.inject(BillTemplateApiService);
      const dto = { name: 'n', shopName: 's', categoryId: 'c', subCategoryId: null };
      api.create(dto).subscribe();
      const req = expectReq('POST', '/api/bill-template');
      expect(req.request.body).toEqual(dto);
      req.flush({ id: 't1' });
    });

    it('update: PUT /{id} with body', () => {
      const api = TestBed.inject(BillTemplateApiService);
      const dto = { name: 'n', shopName: null, categoryId: 'c', subCategoryId: 'sc' };
      api.update('t1', dto).subscribe();
      const req = expectReq('PUT', '/api/bill-template/t1');
      expect(req.request.body).toEqual({ ...dto, id: 't1' });
      req.flush(null);
    });

    it('delete: DELETE /{id}', () => {
      const api = TestBed.inject(BillTemplateApiService);
      api.delete('t1').subscribe();
      expectReq('DELETE', '/api/bill-template/t1').flush(null);
    });

    it('updateOrder: PUT /order with ids object', () => {
      const api = TestBed.inject(BillTemplateApiService);
      api.updateOrder(['a', 'b']).subscribe();
      const req = expectReq('PUT', '/api/bill-template/order');
      expect(req.request.body).toEqual({ ids: ['a', 'b'] });
      req.flush(null);
    });

    it('suggestions: GET /suggestions', () => {
      const api = TestBed.inject(BillTemplateApiService);
      api.suggestions().subscribe();
      expectReq('GET', '/api/bill-template/suggestions').flush([]);
    });

    it('hideSuggestion: POST /hidden-suggestions with key body', () => {
      const api = TestBed.inject(BillTemplateApiService);
      api.hideSuggestion({ shopName: 'Rewe', categoryId: 'c' }).subscribe();
      const req = expectReq('POST', '/api/bill-template/hidden-suggestions');
      expect(req.request.body).toEqual({ shopName: 'Rewe', categoryId: 'c', subCategoryId: null });
      req.flush(null);
    });
  });

  describe('BillApiService (US-0007)', () => {
    it('analyzeBill: POST /analyze multipart file', () => {
      const api = TestBed.inject(BillApiService);
      const file = new File(['x'], 'bill.jpg');
      let result: unknown;
      api.analyzeBill(file).subscribe(r => result = r);
      const req = expectReq('POST', '/api/bill/analyze');
      expect(req.request.body instanceof FormData).toBe(true);
      expect((req.request.body as FormData).get('file')).toBeInstanceOf(File);
      req.flush({ lineItems: [] });
      expect(result).toEqual({ lineItems: [] });
    });

    it('deleteAnalyzedBill: DELETE /analyzed/{id}', () => {
      const api = TestBed.inject(BillApiService);
      api.deleteAnalyzedBill('a1').subscribe();
      expectReq('DELETE', '/api/bill/analyzed/a1').flush(null);
    });

    it('getShopStats: GET /shop-stats maps lastUsed to Date', () => {
      const api = TestBed.inject(BillApiService);
      let result: { lastUsed: Date }[] = [];
      api.getShopStats().subscribe(r => result = r);
      expectReq('GET', '/api/bill/shop-stats').flush([
        { shopName: 'Rewe', categoryId: 'c', subCategoryId: null, count: 2, lastUsed: '2026-01-02T00:00:00' }
      ]);
      expect(result[0].lastUsed).toBeInstanceOf(Date);
    });
  });
});
