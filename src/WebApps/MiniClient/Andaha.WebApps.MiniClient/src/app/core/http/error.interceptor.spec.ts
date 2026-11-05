import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';
import { SKIP_GLOBAL_ERROR } from './skip-global-error';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let openFromComponent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openFromComponent = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { openFromComponent } }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function request(context?: HttpContext): { error: unknown } {
    const result: { error: unknown } = { error: undefined };
    http.get('/api/test', { context }).subscribe({ error: error => result.error = error });
    return result;
  }

  function snackbarMessages(): string[] {
    return openFromComponent.mock.calls.map(call => call[1].data);
  }

  it('shows offline snackbar on status 0', () => {
    request();
    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    expect(snackbarMessages()).toEqual(['Keine Verbindung zum Server']);
  });

  it('shows generic snackbar on 500', () => {
    request();
    httpTesting.expectOne('/api/test').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(snackbarMessages()).toEqual(['Etwas ist schiefgelaufen. Bitte später erneut versuchen.']);
  });

  it('stays silent on 404', () => {
    request();
    httpTesting.expectOne('/api/test').flush('missing', { status: 404, statusText: 'Not Found' });
    expect(openFromComponent).not.toHaveBeenCalled();
  });

  it('stays silent with SKIP_GLOBAL_ERROR', () => {
    request(new HttpContext().set(SKIP_GLOBAL_ERROR, true));
    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    request(new HttpContext().set(SKIP_GLOBAL_ERROR, true));
    httpTesting.expectOne('/api/test').flush('boom', { status: 503, statusText: 'Unavailable' });
    expect(openFromComponent).not.toHaveBeenCalled();
  });

  it('always rethrows', () => {
    const offline = request();
    httpTesting.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    const serverError = request();
    httpTesting.expectOne('/api/test').flush('boom', { status: 500, statusText: 'Server Error' });
    const notFound = request();
    httpTesting.expectOne('/api/test').flush('missing', { status: 404, statusText: 'Not Found' });
    const skipped = request(new HttpContext().set(SKIP_GLOBAL_ERROR, true));
    httpTesting.expectOne('/api/test').flush('boom', { status: 500, statusText: 'Server Error' });

    expect([offline, serverError, notFound, skipped].map(r => (r.error as { status: number }).status)).toEqual([0, 500, 404, 500]);
  });
});
