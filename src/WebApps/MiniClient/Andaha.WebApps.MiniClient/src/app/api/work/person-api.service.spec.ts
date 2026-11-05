import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { PersonApiService } from './person-api.service';

describe('PersonApiService payments', () => {
  let http: HttpTestingController;
  let api: PersonApiService;

  const paymentRequest = (method: string) =>
    http.expectOne(r => r.method === method && new URL(r.url).pathname === '/api/person/p1/payments/pay1');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(PersonApiService);
  });

  afterEach(() => http.verify());

  it('updatePayment: PUT with the pay body', () => {
    const dto = { payedHours: '02:30', payedMoney: 37.5, payedTip: 0, notes: 'bar' };
    api.updatePayment('p1', 'pay1', dto).subscribe();
    const req = paymentRequest('PUT');
    expect(req.request.body).toEqual(dto);
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush(null);
  });

  it('deletePayment: DELETE', () => {
    api.deletePayment('p1', 'pay1').subscribe();
    const req = paymentRequest('DELETE');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush(null);
  });
});
