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

  it('updateBill sends a chosen subcategory', () => {
    TestBed.inject(BillApiService).updateBill('b1', {
      shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1', subCategoryId: 's1'
    }).subscribe();
    const body = http.expectOne(r => r.method === 'PUT').request.body as FormData;
    expect(body.get('subCategoryId')).toBe('s1');
    http.verify();
  });
});
