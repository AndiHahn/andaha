import { HttpEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BillApiService } from './bill-api.service';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { BillSearchResultDto } from './dtos/BillSearchResultDto';
import { PendingAnalysisDto } from './dtos/PendingAnalysisDto';
import { AutoCreatedBillDto } from './dtos/AutoCreatedBillDto';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';

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

    // gespeichert ist die Ortszeit (vom Server als „Z“ markiert): lokale Mitternacht des 4.11.
    expect(result!.values[0].date).toEqual(new Date(2026, 10, 4));
    expect(result!.totalSum).toBe(12.5);
    expect(result!.monthSums).toEqual([{ month: '2026-11', sum: 12.5 }]);
    http.verify();
  });

  it('deleteUserData calls DELETE api/bill/user-data without global error snackbar', () => {
    TestBed.inject(BillApiService).deleteUserData().subscribe();

    const req = http.expectOne(r => r.method === 'DELETE');
    expect(new URL(req.request.url).pathname).toBe('/api/bill/user-data');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush(null);
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

  it('addBill sends lineItems as JSON string', () => {
    const lineItems = [
      { description: 'Milch', quantity: 2, unitPrice: 1.5, totalPrice: 3 },
      { description: 'Brot', quantity: null, unitPrice: null, totalPrice: 2.4 }
    ];
    TestBed.inject(BillApiService).addBill({
      id: 'b1', shopName: 'Billa', price: 5.4, date: new Date(2026, 10, 4), categoryId: 'c1', lineItems
    }).subscribe();

    const body = http.expectOne(r => r.method === 'POST').request.body as FormData;
    expect(body.get('lineItems')).toBe(JSON.stringify(lineItems));
    expect(body.get('shopName')).toBe('Billa');
    http.verify();
  });

  it('updateBill sends an empty lineItems list (removes the items) and leaves the field out when not set', () => {
    const api = TestBed.inject(BillApiService);
    api.updateBill('b1', { shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1', lineItems: [] }).subscribe();
    expect((http.expectOne(r => r.method === 'PUT').request.body as FormData).get('lineItems')).toBe('[]');

    api.updateBill('b1', { shopName: 'Billa', price: 5, date: new Date(2026, 10, 4), categoryId: 'c1' }).subscribe();
    expect((http.expectOne(r => r.method === 'PUT').request.body as FormData).has('lineItems')).toBe(false);
    http.verify();
  });

  it('uploadForAnalysis posts the file with upload progress events and without global error snackbar', () => {
    const events: HttpEvent<{ id: string }>[] = [];
    TestBed.inject(BillApiService).uploadForAnalysis(new Blob(['x'], { type: 'image/jpeg' }), 'kassenbon-ä.jpg')
      .subscribe(event => events.push(event));

    const req = http.expectOne(r => r.method === 'POST');
    expect(new URL(req.request.url).pathname).toBe('/api/bill/upload-for-analysis');
    expect(req.request.reportUploadProgress).toBe(true);
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    expect(((req.request.body as FormData).get('file') as File).name).toBe('kassenbon-ä.jpg');

    req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    req.flush({ id: 'img-1' }, { status: 202, statusText: 'Accepted' });

    expect(events.map(e => e.type)).toEqual([HttpEventType.Sent, HttpEventType.UploadProgress, HttpEventType.Response]);
    http.verify();
  });

  it('getPendingAnalyses maps uploadedAt and skips the global error snackbar', () => {
    let result: PendingAnalysisDto[] | undefined;
    TestBed.inject(BillApiService).getPendingAnalyses().subscribe(r => result = r);

    const req = http.expectOne(r => r.method === 'GET');
    expect(new URL(req.request.url).pathname).toBe('/api/bill/analyzed/pending');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush([{ id: 'img-1', uploadedAt: '2026-11-06T08:15:00+00:00', state: 'analyzing' }]);

    expect(result).toEqual([{ id: 'img-1', uploadedAt: new Date('2026-11-06T08:15:00Z'), state: 'analyzing' }]);
    http.verify();
  });

  it('today request carries tz', () => {
    let result: AutoCreatedBillDto[] | undefined;
    TestBed.inject(BillApiService).getTodayAutoCreated().subscribe(r => result = r);

    const req = http.expectOne(r => r.method === 'GET');
    expect(new URL(req.request.url).pathname).toBe('/api/bill/analyzed/today');
    expect(req.request.params.get('tz')).toBe(currentTimeZone());
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush([{
      billId: 'b1', sourceUploadId: 'img-1', shopName: 'Billa', price: 12.5,
      date: '2026-11-06T00:00:00Z', createdAt: '2026-11-06T08:16:00Z'
    }]);

    // Rechnungstag als lokale Mitternacht (wie BillDto), createdAt als echter UTC-Zeitpunkt
    expect(result).toEqual([{
      billId: 'b1', sourceUploadId: 'img-1', shopName: 'Billa', price: 12.5,
      date: new Date(2026, 10, 6), createdAt: new Date('2026-11-06T08:16:00Z')
    }]);
    http.verify();
  });

  it('getAnalyzedBills skips the global error snackbar only when silent', () => {
    const api = TestBed.inject(BillApiService);

    api.getAnalyzedBills().subscribe();
    expect(http.expectOne(r => r.method === 'GET').request.context.get(SKIP_GLOBAL_ERROR)).toBe(false);

    api.getAnalyzedBills({ silent: true }).subscribe();
    const silent = http.expectOne(r => r.method === 'GET');
    expect(new URL(silent.request.url).pathname).toBe('/api/bill/analyzed');
    expect(silent.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    http.verify();
  });
});
