import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BillApiService } from './bill-api.service';

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
});
