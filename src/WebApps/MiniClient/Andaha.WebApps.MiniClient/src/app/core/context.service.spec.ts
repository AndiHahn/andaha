import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { ContextService } from './context.service';

describe('ContextService wake-up (AC34)', () => {
  let http: HttpTestingController;
  let readyValues: boolean[];

  const pings = (): TestRequest[] => http.match(r => new URL(r.url).pathname.endsWith('/ping'));
  const failAll = (requests: TestRequest[]) => requests.forEach(r => r.error(new ProgressEvent('error')));
  const flushAll = (requests: TestRequest[]) => requests.forEach(r => r.flush(null));

  function createService(): ContextService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { loggedIn: () => of(true) } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(ContextService);
    readyValues = [];
    service.backendReady().subscribe(ready => readyValues.push(ready));
    return service;
  }

  it('reports the backend as unreachable when a wake-up fails', () => {
    const service = createService();
    const initial = pings();
    expect(initial.length).toBe(4);
    expect(service.backendUnreachable()).toBe(false);

    failAll(initial.slice(0, 1));
    flushAll(initial.slice(1));

    expect(service.backendUnreachable()).toBe(true);
    expect(readyValues).toEqual([false]);
  });

  it('wakes up again only the failed services on retry and becomes ready', () => {
    const service = createService();
    const initial = pings();
    failAll(initial.slice(0, 2));
    flushAll(initial.slice(2));

    service.retryWakeUp();

    expect(service.backendUnreachable()).toBe(false);
    const retried = pings();
    expect(retried.length).toBe(2);
    flushAll(retried);

    expect(readyValues).toEqual([false, true]);
    expect(service.backendUnreachable()).toBe(false);
  });

  it('does not send a second ping while one is still pending', () => {
    const service = createService();
    service.retryWakeUp();

    expect(pings().length).toBe(4);
  });

  it('wakes up again when the browser comes back online', () => {
    const service = createService();
    failAll(pings());
    expect(service.backendUnreachable()).toBe(true);

    window.dispatchEvent(new Event('online'));

    expect(service.backendUnreachable()).toBe(false);
    const retried = pings();
    expect(retried.length).toBe(4);
    flushAll(retried);
    expect(readyValues).toEqual([false, true]);
  });

  it('ignores the online event once the backend is ready', () => {
    createService();
    flushAll(pings());

    window.dispatchEvent(new Event('online'));

    expect(pings().length).toBe(0);
  });
});
