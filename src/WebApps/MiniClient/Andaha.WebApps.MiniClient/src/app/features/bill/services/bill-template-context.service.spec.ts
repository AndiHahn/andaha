import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { BillTemplateApiService } from 'src/app/api/shopping/bill-template-api.service';
import { ContextService } from 'src/app/core/context.service';
import { BACKEND_WAIT_MS, BillTemplateContextService } from './bill-template-context.service';

describe('BillTemplateContextService', () => {
  function create(api: Record<string, unknown>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: BillTemplateApiService, useValue: api },
        { provide: ContextService, useValue: { backendReady: () => of(true) } }
      ]
    });
    return TestBed.inject(BillTemplateContextService);
  }

  it('loads templates and suggestions once backend is ready', () => {
    const api = { list: vi.fn(() => of([{ id: 't1' }])), suggestions: vi.fn(() => of([{ shopName: 'Rewe' }])) };
    const svc = create(api);
    let templates: unknown[] = [];
    let suggestions: unknown[] = [];
    svc.templates().subscribe(t => templates = t);
    svc.suggestions().subscribe(s => suggestions = s);
    expect(templates.length).toBe(1);
    expect(suggestions.length).toBe(1);
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('pin creates a fixed-shop template without name and refreshes', async () => {
    const created = { id: 't2', shopName: 'Rewe', categoryId: 'c', sortOrder: 0 };
    const api = {
      list: vi.fn(() => of([])), suggestions: vi.fn(() => of([])),
      create: vi.fn(() => of(created))
    };
    const svc = create(api);
    const result = await svc.pin({ shopName: 'Rewe', categoryId: 'c', subCategoryId: null, count: 3 });
    expect(result).toBe(created);
    expect(api.create).toHaveBeenCalledWith({ shopName: 'Rewe', categoryId: 'c', subCategoryId: null });
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('save/remove/hide/reorder delegate to the api and refresh', async () => {
    const api = {
      list: vi.fn(() => of([])), suggestions: vi.fn(() => of([])),
      create: vi.fn(() => of({})), update: vi.fn(() => of(undefined)), delete: vi.fn(() => of(undefined)),
      hideSuggestion: vi.fn(() => of(undefined)), updateOrder: vi.fn(() => of(undefined))
    };
    const svc = create(api);
    const dto = { categoryId: 'c' };
    await svc.save(null, dto);
    await svc.save('t1', dto);
    await svc.remove('t1');
    await svc.hide({ shopName: 'x', categoryId: 'c' });
    await svc.reorder(['a']);
    expect(api.create).toHaveBeenCalledWith(dto);
    expect(api.update).toHaveBeenCalledWith('t1', dto);
    expect(api.delete).toHaveBeenCalledWith('t1');
    expect(api.hideSuggestion).toHaveBeenCalled();
    expect(api.updateOrder).toHaveBeenCalledWith(['a']);
  });
  it('loaded() turns true only after templates and suggestions both arrived, in either order', () => {
    for (const order of [['list', 'suggestions'], ['suggestions', 'list']] as const) {
      TestBed.resetTestingModule();
      const responses = { list: new Subject<unknown[]>(), suggestions: new Subject<unknown[]>() };
      const svc = create({ list: () => responses.list, suggestions: () => responses.suggestions });
      const values: boolean[] = [];
      svc.loaded().subscribe(v => values.push(v));
      expect(values).toEqual([false]);
      responses[order[0]].next([]);
      responses[order[0]].complete();
      expect(values).toEqual([false]);
      responses[order[1]].next([]);
      responses[order[1]].complete();
      expect(values).toEqual([false, true]);
    }
  });

  it('loaded() also turns true when the requests fail', () => {
    const responses = { list: new Subject<unknown[]>(), suggestions: new Subject<unknown[]>() };
    const svc = create({ list: () => responses.list, suggestions: () => responses.suggestions });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let loaded = false;
    svc.loaded().subscribe(v => loaded = v);
    responses.list.error(new Error('offline'));
    expect(loaded).toBe(false);
    responses.suggestions.error(new Error('offline'));
    expect(loaded).toBe(true);
  });

  it('loaded() stays false while the backend is not ready', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: BillTemplateApiService, useValue: { list: vi.fn(), suggestions: vi.fn() } },
        { provide: ContextService, useValue: { backendReady: () => of(false) } }
      ]
    });
    let loaded: boolean | undefined;
    TestBed.inject(BillTemplateContextService).loaded().subscribe(v => loaded = v);
    expect(loaded).toBe(false);
  });

  describe('backend not ready', () => {
    let ready$: BehaviorSubject<boolean>;
    let context: { backendReady: () => unknown; retryWakeUp: ReturnType<typeof vi.fn> };
    let api: { list: ReturnType<typeof vi.fn>; suggestions: ReturnType<typeof vi.fn> };

    function createOffline() {
      ready$ = new BehaviorSubject(false);
      context = { backendReady: () => ready$, retryWakeUp: vi.fn() };
      api = { list: vi.fn(() => of([{ id: 't1' }])), suggestions: vi.fn(() => of([])) };
      TestBed.configureTestingModule({
        providers: [
          { provide: BillTemplateApiService, useValue: api },
          { provide: ContextService, useValue: context }
        ]
      });
      const svc = TestBed.inject(BillTemplateContextService);
      let failed = false;
      svc.loadFailed().subscribe(f => failed = f);
      return { svc, failed: () => failed };
    }

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('reports a failure when the backend never becomes ready', () => {
      const { failed } = createOffline();
      expect(failed()).toBe(false);
      vi.advanceTimersByTime(BACKEND_WAIT_MS + 1);
      expect(failed()).toBe(true);
      expect(api.list).not.toHaveBeenCalled();
    });

    it('loads and clears the failure when the backend becomes ready later', () => {
      const { svc, failed } = createOffline();
      vi.advanceTimersByTime(BACKEND_WAIT_MS + 1);
      ready$.next(true);
      expect(failed()).toBe(false);
      expect(api.list).toHaveBeenCalledTimes(1);
      let loaded = false;
      svc.loaded().subscribe(l => loaded = l);
      expect(loaded).toBe(true);
    });

    it('retry wakes the backend again and waits anew', () => {
      const { svc, failed } = createOffline();
      vi.advanceTimersByTime(BACKEND_WAIT_MS + 1);
      svc.retry();
      expect(context.retryWakeUp).toHaveBeenCalled();
      expect(failed()).toBe(false);
      vi.advanceTimersByTime(BACKEND_WAIT_MS + 1);
      expect(failed()).toBe(true);
    });

    it('retry reloads directly when the backend is ready', () => {
      const { svc } = createOffline();
      ready$.next(true);
      svc.retry();
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });
});
