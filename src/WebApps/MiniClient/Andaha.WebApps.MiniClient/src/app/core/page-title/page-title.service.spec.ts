import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { PageTitleService } from './page-title.service';

@Component({ template: '', standalone: false })
class DummyComponent { }

describe('PageTitleService', () => {
  let service: PageTitleService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          {
            path: 'bill',
            data: { title: 'Eltern' },
            children: [
              { path: 'list', component: DummyComponent, data: { title: 'Rechnungen' } },
              { path: ':id', component: DummyComponent, data: { title: 'Rechnung', back: '/bill/list' } }
            ]
          },
          { path: 'untitled', component: DummyComponent }
        ])
      ]
    });
    service = TestBed.inject(PageTitleService);
    router = TestBed.inject(Router);
  });

  it('emits deepest route title', async () => {
    await router.navigate(['/bill/list']);
    expect(await firstValueFrom(service.title$)).toBe('Rechnungen');
    expect(await firstValueFrom(service.back$)).toBeNull();
  });

  it('emits back target', async () => {
    await router.navigate(['/bill/42']);
    expect(await firstValueFrom(service.title$)).toBe('Rechnung');
    expect(await firstValueFrom(service.back$)).toBe('/bill/list');
  });

  it('override wins until next navigation', async () => {
    await router.navigate(['/bill/42']);
    service.set('Billa');
    expect(await firstValueFrom(service.title$)).toBe('Billa');
    await router.navigate(['/bill/list']);
    expect(await firstValueFrom(service.title$)).toBe('Rechnungen');
  });

  it('falls back to empty string', async () => {
    await router.navigate(['/untitled']);
    expect(await firstValueFrom(service.title$)).toBe('');
  });

  it('has no header action by default', async () => {
    await router.navigate(['/bill/42']);
    expect(await firstValueFrom(service.action$)).toBeNull();
  });

  it('emits header action after setAction', async () => {
    await router.navigate(['/bill/42']);
    const run = jasmine.createSpy('run');
    service.setAction({ icon: 'history', label: 'Verlauf anzeigen', run });
    const action = await firstValueFrom(service.action$);
    expect(action?.icon).toBe('history');
    expect(action?.label).toBe('Verlauf anzeigen');
    action?.run();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('resets header action on navigation', async () => {
    await router.navigate(['/bill/42']);
    service.setAction({ icon: 'history', label: 'Verlauf anzeigen', run: () => { } });
    await router.navigate(['/bill/list']);
    expect(await firstValueFrom(service.action$)).toBeNull();
  });

  it('delivers overrides asynchronously (avoids NG0100 when set in ngOnInit)', async () => {
    await router.navigate(['/bill/42']);
    const titles: string[] = [];
    const sub = service.title$.subscribe(t => titles.push(t));
    await Promise.resolve();
    titles.length = 0;
    service.set('Billa');
    expect(titles).toEqual([]);
    await new Promise(resolve => setTimeout(resolve));
    expect(titles).toEqual(['Billa']);
    sub.unsubscribe();
  });

  it('clears header action with explicit null', async () => {
    await router.navigate(['/bill/42']);
    service.setAction({ icon: 'history', label: 'Verlauf anzeigen', run: () => { } });
    service.setAction(null);
    expect(await firstValueFrom(service.action$)).toBeNull();
  });
});
