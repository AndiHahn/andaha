import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { BillTemplateApiService } from 'src/app/api/shopping/bill-template-api.service';
import { ContextService } from 'src/app/core/context.service';
import { BillTemplateContextService } from './bill-template-context.service';

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
});
