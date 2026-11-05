import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { CollaborationApiService } from './collaboration-api.service';

describe('CollaborationApiService', () => {
  let http: HttpTestingController;
  let api: CollaborationApiService;

  const deleteTo = (pathname: string) =>
    http.expectOne(r => r.method === 'DELETE' && new URL(r.url).pathname === pathname);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(CollaborationApiService);
  });

  afterEach(() => http.verify());

  it('removeConnection: DELETE api/connection/{userId}', () => {
    api.removeConnection('u1').subscribe();
    const req = deleteTo('/api/connection/u1');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush(null);
  });

  it('withdrawRequest: DELETE api/connection/request/{targetUserId}', () => {
    api.withdrawRequest('u2').subscribe();
    const req = deleteTo('/api/connection/request/u2');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    req.flush(null);
  });
});
