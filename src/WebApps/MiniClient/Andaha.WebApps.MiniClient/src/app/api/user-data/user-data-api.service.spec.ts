import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { UserDataApiService } from './user-data-api.service';

describe('UserDataApiService', () => {
  let http: HttpTestingController;

  const path = (url: string) => new URL(url).pathname;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('deleteAll calls the four endpoints in order and stops on first error', () => {
    let done = 0;
    TestBed.inject(UserDataApiService).deleteAll().subscribe(() => done++);

    const expected = ['/api/bill/user-data', '/api/budgetplan/user-data', '/api/person/user-data', '/api/connection/user-data'];
    for (const endpoint of expected) {
      expect(done).toBe(0);
      const req = http.expectOne(r => r.method === 'DELETE');
      expect(path(req.request.url)).toBe(endpoint);
      expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
      req.flush(null, { status: 204, statusText: 'No Content' });
    }

    expect(done).toBe(1);
    http.verify();

    let failed = false;
    done = 0;
    TestBed.inject(UserDataApiService).deleteAll().subscribe({ next: () => done++, error: () => failed = true });
    http.expectOne(r => path(r.url) === '/api/bill/user-data').flush(null);
    http.expectOne(r => path(r.url) === '/api/budgetplan/user-data').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(failed).toBe(true);
    expect(done).toBe(0);
    http.verify();
  });
});
