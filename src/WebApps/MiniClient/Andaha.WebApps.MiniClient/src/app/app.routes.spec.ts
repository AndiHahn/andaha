import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';

// Alte Analyse-URLs (Lesezeichen, installierte PWA) landen im Analyse-Tab unter Rechnungen.
describe('app routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    router = TestBed.inject(Router);
  });

  it('redirects /analyzed/list to /bill/analysis', async () => {
    await router.navigateByUrl('/analyzed/list');
    expect(router.url).toBe('/bill/analysis');
  });

  it('redirects /analyzed to /bill/analysis', async () => {
    await router.navigateByUrl('/analyzed');
    expect(router.url).toBe('/bill/analysis');
  });

  it('redirects /analyzed/:id to /bill/analysis/:id', async () => {
    await router.navigateByUrl('/analyzed/5');
    expect(router.url).toBe('/bill/analysis/5');
  });

  it('redirects /analyzed/create to /bill/list', async () => {
    await router.navigateByUrl('/analyzed/create');
    expect(router.url).toBe('/bill/list');
  });

  it('keeps /bill/:id a bill detail page', async () => {
    await router.navigateByUrl('/bill/123');
    expect(router.url).toBe('/bill/123');
  });

  it('serves the more page', async () => {
    expect(await router.navigateByUrl('/more')).toBe(true);
    expect(router.url).toBe('/more');
  });
});
