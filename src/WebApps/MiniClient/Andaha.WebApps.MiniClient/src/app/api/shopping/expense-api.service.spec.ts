import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ExpenseApiService } from './expense-api.service';

describe('ExpenseApiService', () => {
  let http: HttpTestingController;
  let api: ExpenseApiService;

  const path = (url: string) => new URL(url).pathname;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ExpenseApiService);
  });

  afterEach(() => http.verify());

  it('getMonthlyExpenses sends until and months', () => {
    let result: unknown;
    api.getMonthlyExpenses('2026-11', 6).subscribe(r => result = r);

    const req = http.expectOne(r => path(r.url) === '/api/expense/monthly');
    expect(req.request.params.get('until')).toBe('2026-11');
    expect(req.request.params.get('months')).toBe('6');
    req.flush([{ month: '2026-11', costs: 12 }]);

    expect(result).toEqual([{ month: '2026-11', costs: 12 }]);
  });

  it('exportExpenses sends the local days and each category name as categoryFilter', () => {
    api.exportExpenses(new Date(2026, 0, 1), new Date(2026, 11, 31, 23, 30), ['Essen', 'Haus & Garten']).subscribe();

    const req = http.expectOne(r => path(r.url) === '/api/expense/export');
    expect(req.request.params.get('startTimeUtc')).toBe('01/01/2026');
    expect(req.request.params.get('endTimeUtc')).toBe('12/31/2026');
    expect(req.request.params.getAll('categoryFilter')).toEqual(['Essen', 'Haus & Garten']);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('exportExpenses without categories sends no categoryFilter', () => {
    api.exportExpenses(new Date(2026, 0, 1), new Date(2026, 0, 31)).subscribe();

    const req = http.expectOne(r => path(r.url) === '/api/expense/export');
    expect(req.request.params.has('categoryFilter')).toBe(false);
    req.flush(new Blob());
  });
});
