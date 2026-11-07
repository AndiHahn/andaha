import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, UrlTree } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { TourService } from 'src/app/core/tour/tour.service';
import { QuickEntryService } from '../../quick-entry/quick-entry.service';
import { AnalysisUploadService } from 'src/app/features/bill-analysis/services/analysis-upload.service';
import { SHARED_IMAGE_CACHE, SHARED_IMAGE_FAILED, sharedImageKey } from '../../scan/shared-image';
import { BillListComponent } from './bill-list.component';

function bill(id: string, date: Date, price: number): BillDto {
  return {
    id,
    category: { id: 'c1', name: 'Lebensmittel', color: '#3B7D4F', order: 0 },
    shopName: `Shop ${id}`,
    price,
    date,
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: false
  };
}

describe('BillListComponent', () => {
  let fixture: ComponentFixture<BillListComponent>;
  let host: HTMLElement;
  let bills$: BehaviorSubject<BillDto[]>;
  let totalResults$: BehaviorSubject<number>;
  let monthSums$: BehaviorSubject<Map<string, number>>;
  let loading$: BehaviorSubject<boolean>;
  let deleteBill: ReturnType<typeof vi.fn>;
  let refreshBills: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let confirmed: boolean;
  /** zuletzt beim OverlayBackService angemeldete Schließen-Funktion (Zurück-Taste) */
  let backClose: (() => void) | null;

  let uploadAll: ReturnType<typeof vi.fn>;
  let searchText: string;
  let queryParams: Record<string, string>;
  let setListReady: ReturnType<typeof vi.fn>;
  let openFromComponent: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    backClose = null;
    searchText = '';
    uploadAll = vi.fn();
    setListReady = vi.fn();
    queryParams = {};
    bills$ = new BehaviorSubject<BillDto[]>([
      bill('b1', new Date(2026, 10, 5), 48.2),
      bill('b2', new Date(2026, 10, 1, 0, 30), 185.9),
      bill('b3', new Date(2026, 9, 30), 23.15)
    ]);
    totalResults$ = new BehaviorSubject(126);
    monthSums$ = new BehaviorSubject(new Map([['2026-11', 312.4], ['2026-10', 820.25]]));
    loading$ = new BehaviorSubject(false);
    deleteBill = vi.fn(() => of(undefined));
    refreshBills = vi.fn();
    confirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(confirmed) }));

    const context: Partial<Record<keyof BillContextService, unknown>> = {
      bills: () => bills$.asObservable(),
      totalResults: () => totalResults$.asObservable(),
      monthSums$: monthSums$.asObservable(),
      pageSize: () => of(50),
      loading: () => loading$.asObservable(),
      lastAddedId: () => of(null),
      error: signal(false),
      waitingForBackend: signal(false),
      retry: vi.fn(),
      getSearchText: () => searchText,
      getCategoryFilter: () => [],
      getFromDateFilter: () => undefined,
      getUntilDateFilter: () => undefined,
      fetchNextBills: vi.fn(),
      refreshBills,
      deleteBill
    };

    TestBed.configureTestingModule({
      imports: [BillListComponent],
      providers: [
        { provide: BillContextService, useValue: context },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: QuickEntryService, useValue: { open: vi.fn() } },
        { provide: TourService, useValue: { setListReady } },
        { provide: AnalysisUploadService, useValue: { uploadAll } },
        { provide: OverlayBackService, useValue: { register: (close: () => void) => { backClose = close; return () => undefined; } } },
        { provide: ActivatedRoute, useValue: { snapshot: { get queryParamMap() { return convertToParamMap(queryParams); } } } }
      ]
    });
    openFromComponent = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(BillListComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const rows = () => Array.from(host.querySelectorAll<HTMLElement>('.bill-link'));
  const menuItems = () => Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel [mat-menu-item]'));
  const itemText = (item: HTMLElement) => item.querySelector('.mat-mdc-menu-item-text')!.textContent!.trim();
  const menuItem = (label: string) => menuItems().find(item => itemText(item) === label)!;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function pointer(type: string): PointerEvent {
    return new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: 10, clientY: 10, pointerType: 'touch', isPrimary: true });
  }

  /** Touch: 500 ms halten und loslassen */
  function longPress(row: HTMLElement): void {
    vi.useFakeTimers();
    try {
      row.dispatchEvent(pointer('pointerdown'));
      vi.advanceTimersByTime(500);
      row.dispatchEvent(pointer('pointerup'));
    } finally {
      vi.useRealTimers();
    }
  }

  /** Desktop: Rechtsklick wie bei den Kacheln der Schnellerfassung */
  async function openMenu(row: HTMLElement): Promise<void> {
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await settle();
  }

  describe('async scan and share target', () => {
    async function openListWith(query: Record<string, string>): Promise<void> {
      queryParams = query;
      fixture = TestBed.createComponent(BillListComponent);
      host = fixture.nativeElement;
      await settle();
      // handleLaunchIntent: Parameter entfernen, dann handeln
      await vi.waitFor(() => expect(TestBed.inject(Router).navigate).toHaveBeenCalled());
      await settle();
    }

    it('camera input opens the camera (capture, no multiple); the photo taken starts one upload', () => {
      // Change Request 2026-11-06: Dock-Kamera öffnet direkt die Kamera, Galerie im Tab „Scans“
      const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
      expect(input.multiple).toBe(false);
      expect(input.getAttribute('capture')).toBe('environment');

      const transfer = new DataTransfer();
      transfer.items.add(new File(['a'], 'a.jpg', { type: 'image/jpeg' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));

      expect(uploadAll).toHaveBeenCalledTimes(1);
      expect((uploadAll.mock.calls[0][0] as File[]).map(f => f.name)).toEqual(['a.jpg']);
    });

    it('no scan overlay or synchronous analyze call remains', async () => {
      const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
      const transfer = new DataTransfer();
      transfer.items.add(new File(['a'], 'a.jpg', { type: 'image/jpeg' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
      await settle();

      expect(document.querySelector('app-scan-overlay, .andaha-scan')).toBeNull();
      expect('analyzeBill' in BillApiService.prototype).toBe(false);
      expect(TestBed.inject(Router).navigate).not.toHaveBeenCalledWith(['/bill/create'], expect.anything());
    });

    it('?shared=1 uploads all shared images from the cache', async () => {
      const cache = await caches.open(SHARED_IMAGE_CACHE);
      await cache.put(sharedImageKey(0), new Response(new Blob(['1'], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': 'a.jpg' } }));
      await cache.put(sharedImageKey(1), new Response(new Blob(['2'], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': 'b.jpg' } }));

      await openListWith({ shared: '1' });
      await vi.waitFor(() => expect(uploadAll).toHaveBeenCalled());

      expect((uploadAll.mock.calls[0][0] as File[]).map(f => f.name)).toEqual(['a.jpg', 'b.jpg']);
      expect(await cache.match(sharedImageKey(0))).toBeUndefined();
      expect(await cache.match(sharedImageKey(1))).toBeUndefined();
    });

    it('?shared=0 shows the existing failure snackbar', async () => {
      await openListWith({ shared: '0' });

      await vi.waitFor(() => expect(openFromComponent).toHaveBeenCalled());
      expect(JSON.stringify(openFromComponent.mock.calls[0][1])).toContain(SHARED_IMAGE_FAILED);
      expect(uploadAll).not.toHaveBeenCalled();
    });
  });

  describe('line item search match', () => {
    async function showWithMatch(term: string): Promise<void> {
      searchText = term;
      bills$.next([
        { ...bill('b1', new Date(2026, 10, 5), 48.2), matchedLineItem: { description: 'Druckerpatronen XL', totalPrice: 34.99 } },
        bill('b2', new Date(2026, 10, 1, 0, 30), 185.9)
      ]);
      await settle();
    }

    it('shows matched line item row during search', async () => {
      await showWithMatch('Drucker');

      const match = rows()[0].querySelector('.match-row')!;
      expect(match.textContent).toContain('Druckerpatronen XL · 34,99 €');
      expect(match.querySelector('mat-icon')?.textContent?.trim()).toBe('search');
      expect(rows()[1].querySelector('.match-row')).toBeNull();
    });

    it('tap opens bill with q param', async () => {
      const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      await showWithMatch('Drucker');

      rows()[0].click();

      expect(String(navigateByUrl.mock.calls[0][0])).toBe('/bill/b1?q=Drucker');
    });

    it('carries special characters raw in the q param', async () => {
      const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      await showWithMatch('a&b ü');

      rows()[0].click();

      const tree = navigateByUrl.mock.calls[0][0] as UrlTree;
      expect(tree.queryParams).toEqual({ q: 'a&b ü' });
    });

    it('shows only the description when the match has no price', async () => {
      searchText = 'Pfand';
      bills$.next([{ ...bill('b1', new Date(2026, 10, 5), 48.2), matchedLineItem: { description: 'Pfand', totalPrice: null } }]);
      await settle();

      expect(rows()[0].querySelector('.match-text')!.textContent!.trim()).toBe('Pfand');
    });

    it('no extra row without search', async () => {
      await showWithMatch('');

      expect(host.querySelector('.match-row')).toBeNull();
    });
  });

  it('no total line above the list', () => {
    expect(host.querySelector('.sum')).toBeNull();
    expect(host.textContent).not.toContain('126 Rechnungen');
    expect(host.textContent).not.toContain('8.412,30');
  });

  it('renders month header with backend sum', () => {
    const headers = Array.from(host.querySelectorAll('.month-head'))
      .map(h => [h.querySelector('b')?.textContent?.trim(), h.querySelector('span')?.textContent?.trim()]);

    expect(headers).toEqual([['November 2026', '312,40 €'], ['Oktober 2026', '820,25 €']]);
    // Rechnung am Monatsersten 00:30 lokal steht unter November
    const november = host.querySelectorAll('.month-group')[0];
    expect(november.textContent).toContain('Shop b2');
  });

  it('shows no month headers but the empty state when nothing matches', () => {
    bills$.next([]);
    totalResults$.next(0);
    monthSums$.next(new Map());
    fixture.detectChanges();

    expect(host.querySelectorAll('.month-head').length).toBe(0);
    expect(host.querySelector('app-load-state .empty')).not.toBeNull();
  });

  it('shows loading, not the empty state, while the backend is still waking up (AC34)', () => {
    const context = TestBed.inject(BillContextService) as unknown as { waitingForBackend: ReturnType<typeof signal<boolean>> };
    context.waitingForBackend.set(true);
    bills$.next([]);
    totalResults$.next(0);
    fixture.detectChanges();

    expect(host.querySelector('app-load-state .empty')).toBeNull();
    expect(fixture.componentInstance.loadState).toBe('loading');
  });

  it('tab swipe: rows no longer carry data-no-swipe', () => {
    expect(rows().length).toBe(3);
    rows().forEach(row => expect(row.closest('[data-no-swipe]')).toBeNull());
    expect(host.querySelector('[data-no-swipe] .bill-link')).toBeNull();
  });

  it('long press on a bill row opens menu with Duplizieren and Löschen', async () => {
    longPress(rows()[0]);
    await settle();

    expect(menuItems().map(itemText)).toEqual(['Duplizieren', 'Löschen']);
  });

  it('right click on a bill row opens the same menu (desktop)', async () => {
    await openMenu(rows()[1]);

    expect(menuItems().map(itemText)).toEqual(['Duplizieren', 'Löschen']);
  });

  it('external bill: menu offers only Duplizieren', async () => {
    bills$.next([{ ...bill('ext', new Date(2026, 10, 4), 12), isExternal: true }]);
    fixture.detectChanges();

    await openMenu(rows()[0]);

    expect(menuItems().map(itemText)).toEqual(['Duplizieren']);
  });

  it('Löschen asks confirmation, deletes, vibrates', async () => {
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
    await openMenu(rows()[0]);

    menuItem('Löschen').click();
    await vi.waitFor(() => expect(deleteBill).toHaveBeenCalledWith('b1'));

    expect(openConfirmation).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(30);
    vibrate.mockRestore();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    confirmed = false;
    await openMenu(rows()[0]);

    menuItem('Löschen').click();
    await vi.waitFor(() => expect(openConfirmation).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve));

    expect(deleteBill).not.toHaveBeenCalled();
  });

  it('reports a failed delete', async () => {
    deleteBill.mockReturnValue(throwError(() => new Error('offline')));
    const snackbar = TestBed.inject(MatSnackBar).openFromComponent as unknown as ReturnType<typeof vi.fn>;
    await openMenu(rows()[0]);

    menuItem('Löschen').click();

    await vi.waitFor(() => expect(snackbar).toHaveBeenCalled());
    expect(JSON.stringify(snackbar.mock.calls[0])).toContain('Rechnung konnte nicht gelöscht werden.');
  });

  it('Duplizieren navigates to /bill/create with prefill', async () => {
    const navigate = TestBed.inject(Router).navigate as unknown as ReturnType<typeof vi.fn>;
    await openMenu(rows()[2]);

    menuItem('Duplizieren').click();

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/bill/create'], expect.objectContaining({
      state: { prefill: expect.objectContaining({ shopName: 'Shop b3', price: 23.15, categoryId: 'c1' }) }
    })));
  });

  it('tap after long press does not navigate', async () => {
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const row = rows()[0];

    longPress(row);
    row.click();
    await settle();
    expect(navigateByUrl).not.toHaveBeenCalled();

    // ein normaler Tipp öffnet weiter die Detailseite
    row.dispatchEvent(pointer('pointerdown'));
    row.dispatchEvent(pointer('pointerup'));
    row.click();
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
    expect(String(navigateByUrl.mock.calls[0][0])).toBe('/bill/b1');
  });

  it('back closes the row menu', async () => {
    await openMenu(rows()[0]);
    expect(menuItems().length).toBe(2);

    backClose!();
    await settle();

    await vi.waitFor(() => expect(document.querySelector('.mat-mdc-menu-panel')).toBeNull());
  });

  it('shows the error state with retry when loading failed', () => {
    const context = TestBed.inject(BillContextService) as unknown as { error: ReturnType<typeof signal<boolean>>; retry: ReturnType<typeof vi.fn> };
    context.error.set(true);
    bills$.next([]);
    totalResults$.next(0);
    fixture.detectChanges();

    const retry = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Erneut versuchen'));
    expect(retry).toBeDefined();
    retry!.click();
    expect(context.retry).toHaveBeenCalled();
  });

  describe('tour readiness', () => {
    it('reports list ready after the first load', () => {
      expect(setListReady).toHaveBeenCalledTimes(1);
      expect(setListReady).toHaveBeenCalledWith(true);
    });

    it('does not report ready while the first load is pending', async () => {
      setListReady.mockClear();
      const context = TestBed.inject(BillContextService) as unknown as { waitingForBackend: ReturnType<typeof signal<boolean>> };
      context.waitingForBackend.set(true);
      bills$.next([]);
      fixture = TestBed.createComponent(BillListComponent);
      await settle();

      expect(setListReady).not.toHaveBeenCalledWith(true);
      context.waitingForBackend.set(false);
      await settle();
      expect(setListReady).toHaveBeenCalledWith(true);
    });

    it('does not report ready before the launch intent is handled', async () => {
      setListReady.mockClear();
      const open = TestBed.inject(QuickEntryService).open as ReturnType<typeof vi.fn>;
      open.mockClear();
      let finishNavigation!: (ok: boolean) => void;
      vi.mocked(TestBed.inject(Router).navigate).mockReturnValue(new Promise<boolean>(resolve => finishNavigation = resolve));
      queryParams = { quick: '1' };
      fixture = TestBed.createComponent(BillListComponent);
      await settle();

      expect(open).not.toHaveBeenCalled();
      expect(setListReady).not.toHaveBeenCalled();

      setListReady.mockImplementation(() => expect(open).toHaveBeenCalled());
      finishNavigation(true);
      await vi.waitFor(() => expect(setListReady).toHaveBeenCalledWith(true));
      expect(open).toHaveBeenCalledTimes(1);
    });

    it('stays ready when the list reloads', async () => {
      loading$.next(true);
      bills$.next([]);
      await settle();
      loading$.next(false);
      await settle();

      expect(setListReady).toHaveBeenCalledTimes(1);
    });

    it('reports not ready on destroy', () => {
      setListReady.mockClear();
      fixture.destroy();

      expect(setListReady).toHaveBeenCalledWith(false);
    });
  });
});
