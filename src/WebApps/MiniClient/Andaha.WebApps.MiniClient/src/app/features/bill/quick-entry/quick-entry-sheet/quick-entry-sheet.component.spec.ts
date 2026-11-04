import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillSuggestionDto } from 'src/app/api/shopping/dtos/BillSuggestionDto';
import { BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { PagedResultDto } from 'src/app/api/common-dtos/PagedResultDto';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { SuccessSnackbarComponent } from 'src/app/shared/snackbar/success-snackbar/success-snackbar.component';
import { BillContextService } from '../../services/bill-context.service';
import { BillTemplateContextService } from '../../services/bill-template-context.service';
import { ShopStatsContextService } from '../../services/shop-stats-context.service';
import { QuickEntryDraft } from '../logic/draft-store';
import { toDayKey } from '../logic/quick-entry-state';
import { QuickEntryDraftService } from '../quick-entry-draft.service';
import { QUICK_ENTRY_RESTORE_TIMEOUT_MS, QuickEntrySheetComponent } from './quick-entry-sheet.component';

const categories: CategoryDto[] = [
  {
    id: 'c1', name: 'Lebensmittel', color: '#7FB89A', order: 0, includeToStatistics: true, isDefault: false,
    subCategories: [{ id: 's1', name: 'Gebäck', order: 0 }]
  },
  {
    id: 'c2', name: 'Freizeit', color: '#8AA6D9', order: 1, includeToStatistics: true, isDefault: false,
    subCategories: [{ id: 's2', name: 'Café & Restaurant', order: 0 }]
  }
];

const templates: BillTemplateDto[] = [
  { id: 't1', name: null, shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', sortOrder: 0 },
  { id: 't2', name: 'Wocheneinkauf', shopName: null, categoryId: 'c1', subCategoryId: null, sortOrder: 1 }
];

const suggestions: BillSuggestionDto[] = [
  { shopName: 'Thalia', categoryId: 'c2', subCategoryId: 's2', count: 5 }
];

function todayAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function bill(p: Partial<BillDto>): BillDto {
  return {
    id: 'b1', shopName: 'Bäcker Ruetz', price: 6.8, date: todayAt(7, 42),
    category: { id: 'other-user-c1', name: 'Lebensmittel', color: '#7FB89A', order: 0 },
    subCategory: { id: 'other-user-s1', name: 'Gebäck', order: 0 },
    isExternal: false, fromAnalysis: false, imageAvailable: false, ...p
  };
}

interface SetupOptions {
  mode?: 'sheet' | 'dialog';
  draft?: QuickEntryDraft | null;
  dayBills?: () => Observable<PagedResultDto<BillDto>>;
  frequentShops?: string[];
  templates$?: Observable<BillTemplateDto[]>;
  suggestions$?: Observable<BillSuggestionDto[]>;
  loaded$?: Observable<boolean>;
  restoreTimeoutMs?: number;
}

describe('QuickEntrySheetComponent', () => {
  let fixture: ComponentFixture<QuickEntrySheetComponent>;
  let host: HTMLElement;
  let addBill: ReturnType<typeof vi.fn>;
  let saveTemplate: ReturnType<typeof vi.fn>;
  let pin: ReturnType<typeof vi.fn>;
  let hide: ReturnType<typeof vi.fn>;
  let recordLocal: ReturnType<typeof vi.fn>;
  let frequentShops: ReturnType<typeof vi.fn>;
  let searchBills: ReturnType<typeof vi.fn>;
  let draftService: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let sheetRef: { dismiss: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function setup(options: SetupOptions = {}): Promise<void> {
    addBill = vi.fn(() => Promise.resolve());
    saveTemplate = vi.fn(() => Promise.resolve());
    pin = vi.fn(() => Promise.resolve());
    hide = vi.fn(() => Promise.resolve());
    recordLocal = vi.fn();
    frequentShops = vi.fn(() => options.frequentShops ?? []);
    searchBills = vi.fn(options.dayBills ?? (() => of({ values: [], totalCount: 0 })));
    draftService = { load: vi.fn(() => options.draft ?? null), save: vi.fn(), clear: vi.fn() };
    sheetRef = { dismiss: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [QuickEntrySheetComponent],
      providers: [
        provideRouter([]),
        { provide: BillContextService, useValue: { addBill } },
        { provide: BillCategoryContextService, useValue: { categories: () => of(categories) } },
        {
          provide: BillTemplateContextService,
          useValue: {
            templates: () => options.templates$ ?? of(templates),
            suggestions: () => options.suggestions$ ?? of(suggestions),
            loaded: () => options.loaded$ ?? of(true),
            save: saveTemplate, pin, hide
          }
        },
        { provide: QUICK_ENTRY_RESTORE_TIMEOUT_MS, useValue: options.restoreTimeoutMs ?? 4000 },
        {
          provide: ShopStatsContextService,
          useValue: { shopNames: () => ['Café Central', 'Billa'], frequentShops, recordLocal }
        },
        { provide: BillApiService, useValue: { searchBills } },
        { provide: QuickEntryDraftService, useValue: draftService },
        // Menüs melden sich sonst mit echten History-Einträgen an
        { provide: OverlayBackService, useValue: { register: () => () => undefined } },
        options.mode === 'dialog'
          ? { provide: MatDialogRef, useValue: dialogRef }
          : { provide: MatBottomSheetRef, useValue: sheetRef }
      ]
    });

    fixture = TestBed.createComponent(QuickEntrySheetComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function all(selector: string): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>(selector));
  }

  function byText(selector: string, text: string): HTMLElement {
    const match = all(selector).find(el => el.textContent!.replace(/\s+/g, ' ').trim().includes(text));
    if (!match) {
      throw new Error(`No ${selector} with text "${text}"`);
    }
    return match;
  }

  async function click(el: HTMLElement): Promise<void> {
    el.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function type(keys: string): Promise<void> {
    for (const key of keys) {
      const button = key === '<'
        ? host.querySelector<HTMLElement>('app-amount-keypad button[aria-label="Löschen"]')!
        : byText('app-amount-keypad button', key);
      await click(button);
    }
  }

  function saveButton(): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('button.save')!;
  }

  function saveLabel(): string {
    return saveButton().querySelector('.label')!.textContent!.trim();
  }

  function menuItems(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-menu-panel [mat-menu-item]'));
  }

  function itemText(item: HTMLElement): string {
    return item.querySelector('.mat-mdc-menu-item-text')!.textContent!.trim();
  }

  function text(): string {
    return host.textContent!.replace(/\s+/g, ' ');
  }

  it('locks saving with a hint until amount and tile are set, then folds the keypad away', async () => {
    await setup();

    expect(host.querySelector('[role="radiogroup"][aria-label="Vorlage"]')).not.toBeNull();
    expect(saveButton().disabled).toBe(true);
    expect(host.querySelector('.need')!.textContent!.trim()).toBe('Betrag eingeben und Vorlage wählen');
    expect(host.querySelector('app-amount-keypad')).not.toBeNull();

    await type('6,80');
    expect(host.querySelector('.amount')!.textContent).toContain('6,80');
    expect(saveButton().disabled).toBe(true);
    expect(host.querySelector('.need')!.textContent!.trim()).toBe('Vorlage wählen');

    const tile = byText('[role="radio"]', 'Bäcker Ruetz');
    await click(tile);
    expect(tile.getAttribute('aria-checked')).toBe('true');
    expect(saveButton().disabled).toBe(false);
    expect(host.querySelector('.need')).toBeNull();
    expect(host.querySelector('app-amount-keypad')).toBeNull();

    await click(host.querySelector<HTMLElement>('.amount')!);
    expect(host.querySelector('app-amount-keypad')).not.toBeNull();
  });

  it('shows templates first and suggestions after them, plus "Andere …"', async () => {
    await setup();
    const titles = all('[role="radio"] b').map(b => b.textContent!.trim());
    expect(titles).toEqual(['Bäcker Ruetz', 'Wocheneinkauf', 'Thalia']);
    expect(byText('[role="radio"]', 'Wocheneinkauf').textContent).toContain('Lebensmittel · Shop wählen');
    expect(byText('button', 'Andere …')).toBeTruthy();
  });

  it('shows shop chips for a template without shop, most frequent shop preselected', async () => {
    await setup({ frequentShops: ['Billa', 'Hofer', 'Spar'] });
    await type('87,35');
    await click(byText('[role="radio"]', 'Wocheneinkauf'));

    expect(frequentShops).toHaveBeenCalledWith('c1', null, 5);
    const chips = all('.shoprow [role="radio"]');
    expect(chips.map(c => c.querySelector('.label')!.textContent!.trim())).toEqual(['Billa', 'Hofer', 'Spar', 'Anderer …']);
    expect(chips[0].getAttribute('aria-checked')).toBe('true');
    expect(text()).toContain('häufigste zuerst');
    expect(saveButton().disabled).toBe(false);

    await click(chips[1]);
    await click(saveButton());
    expect(addBill.mock.calls[0][0].shopName).toBe('Hofer');
  });

  it('"Anderer …" chip takes a free shop name', async () => {
    await setup({ frequentShops: ['Billa'] });
    await type('5');
    await click(byText('[role="radio"]', 'Wocheneinkauf'));
    await click(byText('.shoprow [role="radio"]', 'Anderer …'));

    const input = host.querySelector<HTMLInputElement>('.shoprow input')!;
    input.value = 'Merkur';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await click(saveButton());
    expect(addBill.mock.calls[0][0].shopName).toBe('Merkur');
  });

  it('"Andere …" with "Als Vorlage merken" saves the bill, then a template with fixed shop', async () => {
    await setup();
    await type('4,20');
    await click(byText('button', 'Andere …'));

    const shop = host.querySelector<HTMLInputElement>('input[name="shopName"]')!;
    shop.value = 'Café Central';
    shop.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onCategoryChange('c2');
    fixture.detectChanges();
    component.onSubCategoryChange('s2');
    fixture.detectChanges();

    const toggle = host.querySelector<HTMLElement>('[role="switch"]')!;
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    await click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await click(saveButton());

    expect(addBill).toHaveBeenCalledTimes(1);
    const [dto, category, subCategory] = addBill.mock.calls[0];
    expect(dto).toEqual(expect.objectContaining({ shopName: 'Café Central', categoryId: 'c2', subCategoryId: 's2', price: 4.2 }));
    expect(category).toEqual({ id: 'c2', name: 'Freizeit', color: '#8AA6D9', order: 1 });
    expect(subCategory).toEqual({ id: 's2', name: 'Café & Restaurant', order: 0 });
    expect(saveTemplate).toHaveBeenCalledWith(null, { shopName: 'Café Central', categoryId: 'c2', subCategoryId: 's2' });
    expect(addBill.mock.invocationCallOrder[0]).toBeLessThan(saveTemplate.mock.invocationCallOrder[0]);
  });

  it('"Andere …" without the switch saves no template', async () => {
    await setup();
    await type('4,20');
    await click(byText('button', 'Andere …'));
    const shop = host.querySelector<HTMLInputElement>('input[name="shopName"]')!;
    shop.value = 'Café Central';
    shop.dispatchEvent(new Event('input'));
    fixture.componentInstance.onCategoryChange('c2');
    fixture.detectChanges();
    await click(saveButton());
    expect(addBill).toHaveBeenCalledTimes(1);
    expect(saveTemplate).not.toHaveBeenCalled();
  });

  it('warns about a duplicate on the same day and offers "Trotzdem speichern"', async () => {
    await setup({ dayBills: () => of({ values: [bill({})], totalCount: 1 }) });
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));

    const warn = host.querySelector<HTMLElement>('.warn[role="status"]')!;
    expect(warn.textContent).toContain('Heute schon eingetragen');
    expect(warn.textContent).toContain('Bäcker Ruetz · 6,80 € um 07:42');
    expect(saveLabel()).toBe('Trotzdem speichern');
    expect(saveButton().disabled).toBe(false);

    const [params] = searchBills.mock.calls[0];
    expect(toDayKey(params.fromDateFilter)).toBe(toDayKey(new Date()));

    await click(saveButton());
    expect(addBill).toHaveBeenCalledTimes(1);
  });

  it('duplicate hint leaves out the time for a bill stored without time (UTC midnight)', async () => {
    const today = new Date();
    const utcMidnight = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    await setup({ dayBills: () => of({ values: [bill({ date: utcMidnight })], totalCount: 1 }) });
    fixture.componentInstance.onDateChange(new Date(utcMidnight));
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));

    const warn = host.querySelector<HTMLElement>('.warn[role="status"]')!;
    expect(warn.textContent).toContain('Bäcker Ruetz · 6,80 €. Trotzdem speichern?');
    expect(warn.textContent).not.toContain(' um ');
  });

  it('tile first, then typing: the keypad stays open while typing and Speichern is enabled', async () => {
    await setup();
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));
    await type('6,80');
    expect(host.querySelector('.amount')!.textContent).toContain('6,80');
    expect(host.querySelector('app-amount-keypad')).not.toBeNull();
    expect(saveButton().disabled).toBe(false);
    expect(host.querySelector('.need')).toBeNull();
  });

  it('does not warn for a different amount', async () => {
    await setup({ dayBills: () => of({ values: [bill({})], totalCount: 1 }) });
    await type('6,90');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));
    expect(host.querySelector('.warn')).toBeNull();
    expect(saveLabel()).toBe('Speichern');
  });

  it('offline: a failing duplicate query shows no hint and saving still calls addBill', async () => {
    await setup({ dayBills: () => throwError(() => new Error('offline')) });
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));

    expect(host.querySelector('.warn')).toBeNull();
    expect(saveLabel()).toBe('Speichern');
    expect(saveButton().disabled).toBe(false);

    await click(saveButton());
    expect(addBill).toHaveBeenCalledTimes(1);
    expect(sheetRef.dismiss).toHaveBeenCalled();
  });

  it('after saving: snackbar, vibration, shop stats, draft cleared, sheet closed', async () => {
    await setup();
    const snackbar = TestBed.inject(MatSnackBar);
    const open = vi.spyOn(snackbar, 'openFromComponent');
    const vibrate = vi.fn(() => true);
    vi.spyOn(navigator, 'vibrate').mockImplementation(vibrate);

    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));
    draftService.clear.mockClear();
    await click(saveButton());

    const [dto, category, subCategory] = addBill.mock.calls[0];
    expect(dto).toEqual(expect.objectContaining({ shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', price: 6.8 }));
    expect(toDayKey(dto.date)).toBe(toDayKey(new Date()));
    expect(category.id).toBe('c1');
    expect(subCategory.id).toBe('s1');

    expect(open).toHaveBeenCalledWith(SuccessSnackbarComponent, expect.objectContaining({ data: 'Gespeichert · Bäcker Ruetz 6,80 €' }));
    expect(vibrate).toHaveBeenCalledWith(30);
    expect(recordLocal).toHaveBeenCalledWith('Bäcker Ruetz', 'c1', 's1', dto.date);
    expect(draftService.clear).toHaveBeenCalled();
    expect(sheetRef.dismiss).toHaveBeenCalled();
    expect(saveTemplate).not.toHaveBeenCalled();

    // geschlossen nach dem Speichern: kein Entwurf mehr schreiben
    draftService.save.mockClear();
    fixture.destroy();
    expect(draftService.save).not.toHaveBeenCalled();
  });

  it('saves only once on a double tap', async () => {
    await setup();
    let resolve!: () => void;
    addBill.mockImplementation(() => new Promise<void>(r => resolve = r));
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));

    saveButton().click();
    saveButton().click();
    resolve();
    await fixture.whenStable();
    expect(addBill).toHaveBeenCalledTimes(1);
  });

  it('keeps the sheet open when saving fails', async () => {
    await setup();
    addBill.mockImplementation(() => Promise.reject(new Error('quota')));
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));
    await click(saveButton());
    expect(sheetRef.dismiss).not.toHaveBeenCalled();
    expect(saveButton().disabled).toBe(false);
  });

  it('keeps a draft when closed without saving and restores it with "Verwerfen"', async () => {
    await setup();
    await type('23,4');
    fixture.destroy();
    const saved = draftService.save.mock.calls.at(-1)![0];
    expect(saved).toEqual(expect.objectContaining({ amountText: '23,4', tileKey: null, date: toDayKey(new Date()) }));

    TestBed.resetTestingModule();
    await setup({ draft: { ...saved, savedAt: Date.now() } });
    const restored = host.querySelector<HTMLElement>('.restored[role="status"]')!;
    expect(restored.textContent).toContain('Entwurf wiederhergestellt');
    expect(host.querySelector('.amount')!.textContent).toContain('23,4');

    draftService.clear.mockClear();
    await click(byText('.restored button', 'Verwerfen'));
    expect(draftService.clear).toHaveBeenCalled();
    expect(host.querySelector('.restored')).toBeNull();
    expect(host.querySelector('.amount')!.textContent).toContain('0,00');
  });

  it('restores the selected tile of a draft', async () => {
    await setup({
      draft: { amountText: '6,80', tileKey: 't|t1', shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', date: toDayKey(new Date()), savedAt: Date.now() }
    });
    expect(byText('[role="radio"]', 'Bäcker Ruetz').getAttribute('aria-checked')).toBe('true');
    expect(saveButton().disabled).toBe(false);
  });

  describe('draft restore while templates and suggestions are still loading', () => {
    const thaliaDraft = (): QuickEntryDraft => ({
      amountText: '12,99', tileKey: 's|thalia|c2|s2', shopName: 'Thalia', categoryId: 'c2', subCategoryId: 's2',
      date: toDayKey(new Date()), savedAt: Date.now()
    });
    let templates$: BehaviorSubject<BillTemplateDto[]>;
    let suggestions$: BehaviorSubject<BillSuggestionDto[]>;
    let loaded$: BehaviorSubject<boolean>;

    async function setupLoading(extra: SetupOptions = {}): Promise<void> {
      templates$ = new BehaviorSubject<BillTemplateDto[]>([]);
      suggestions$ = new BehaviorSubject<BillSuggestionDto[]>([]);
      loaded$ = new BehaviorSubject(false);
      await setup({ draft: thaliaDraft(), templates$, suggestions$, loaded$, ...extra });
    }

    async function settle(): Promise<void> {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('restores a suggestion tile when templates arrive first', async () => {
      await setupLoading();
      templates$.next(templates);
      await settle();
      suggestions$.next(suggestions);
      loaded$.next(true);
      await settle();
      expect(byText('[role="radio"]', 'Thalia').getAttribute('aria-checked')).toBe('true');
      expect(saveButton().disabled).toBe(false);
    });

    it('restores a suggestion tile when suggestions arrive first', async () => {
      await setupLoading();
      suggestions$.next(suggestions);
      await settle();
      templates$.next(templates);
      loaded$.next(true);
      await settle();
      expect(byText('[role="radio"]', 'Thalia').getAttribute('aria-checked')).toBe('true');
    });

    it('both loads failed: keeps the amount, drops the tile and persists the own choice of the user', async () => {
      await setupLoading();
      loaded$.next(true);
      await settle();
      expect(host.querySelector('.amount')!.textContent).toContain('12,99');
      expect(all('[role="radio"][aria-checked="true"]')).toEqual([]);

      await click(byText('button', 'Andere …'));
      fixture.destroy();
      const saved = draftService.save.mock.calls.at(-1)![0];
      expect(saved.tileKey).toBeNull();
      expect(saved.categoryId).toBeNull();
      expect(saved.shopName).toBeNull();
    });

    it('a tile picked before loading finished is not overridden by the draft', async () => {
      await setupLoading();
      templates$.next(templates);
      await settle();
      await click(byText('[role="radio"]', 'Bäcker Ruetz'));
      suggestions$.next(suggestions);
      loaded$.next(true);
      await settle();
      expect(byText('[role="radio"]', 'Bäcker Ruetz').getAttribute('aria-checked')).toBe('true');
      expect(byText('[role="radio"]', 'Thalia').getAttribute('aria-checked')).toBe('false');
    });

    it('stops waiting after the timeout (backend never ready)', async () => {
      await setupLoading({ restoreTimeoutMs: 20 });
      suggestions$.next(suggestions);
      await new Promise(resolve => setTimeout(resolve, 60));
      await settle();
      expect(byText('[role="radio"]', 'Thalia').getAttribute('aria-checked')).toBe('true');
    });
  });

  it('drops a draft tile whose template was deleted, keeping the amount', async () => {
    await setup({
      draft: { amountText: '6,80', tileKey: 't|deleted', shopName: 'Weg', categoryId: 'c1', subCategoryId: null, date: toDayKey(new Date()), savedAt: Date.now() }
    });
    expect(all('[role="radio"][aria-checked="true"]')).toEqual([]);
    expect(host.querySelector('.amount')!.textContent).toContain('6,80');
    expect(host.querySelector('.need')!.textContent!.trim()).toBe('Vorlage wählen');
  });

  it('date menu offers Heute · Gestern · Datum wählen and "Gestern" moves the date', async () => {
    await setup();
    expect(host.querySelector('.meta')!.textContent).toContain('Heute, ');
    await click(host.querySelector<HTMLElement>('.meta .date-btn')!);
    expect(menuItems().map(itemText)).toEqual(['Heute', 'Gestern', 'Datum wählen']);
    await click(menuItems()[1]);
    expect(host.querySelector('.meta')!.textContent).toContain('Gestern, ');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(toDayKey(searchBills.mock.calls.at(-1)![0].fromDateFilter)).toBe(toDayKey(yesterday));
  });

  it('long press on a suggestion offers pinning and hiding', async () => {
    await setup();
    const tile = byText('[role="radio"]', 'Thalia');
    tile.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = document.querySelector<HTMLElement>('.mat-mdc-menu-panel')!;
    expect(panel.textContent).toContain('Vorschlag');
    expect(panel.textContent).toContain('Thalia · Freizeit · Café & Restaurant');
    const items = Array.from(panel.querySelectorAll<HTMLElement>('[mat-menu-item]'));
    expect(items.map(itemText)).toEqual(['Als Vorlage anheften', 'Nicht mehr vorschlagen']);
    await click(items[0]);
    expect(pin).toHaveBeenCalledWith(suggestions[0]);
    expect(tile.getAttribute('aria-checked')).toBe('false');
  });

  it('long press on a template opens no menu', async () => {
    await setup();
    byText('[role="radio"]', 'Bäcker Ruetz').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.mat-mdc-menu-panel')).toBeNull();
  });

  it('"Alle Felder" closes the sheet first and then opens the form with the entered values', async () => {
    await setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await type('6,80');
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));
    await click(byText('.meta button', 'Alle Felder'));

    expect(sheetRef.dismiss).toHaveBeenCalled();
    expect(sheetRef.dismiss.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
    expect(navigate).toHaveBeenCalledWith(['/bill/create'], {
      state: { prefill: { price: 6.8, shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', date: toDayKey(new Date()) } }
    });
  });

  it('desktop dialog: amount as decimal input, no keypad, "Abbrechen | Speichern"', async () => {
    await setup({ mode: 'dialog' });
    expect(host.querySelector('app-amount-keypad')).toBeNull();
    const input = host.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
    input.value = '12.5';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await click(byText('[role="radio"]', 'Bäcker Ruetz'));

    expect(byText('button', 'Abbrechen')).toBeTruthy();
    await click(saveButton());
    expect(addBill.mock.calls[0][0].price).toBe(12.5);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('desktop dialog: "Abbrechen" closes and keeps the draft', async () => {
    await setup({ mode: 'dialog' });
    const input = host.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
    input.value = '3,5';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await click(byText('button', 'Abbrechen'));
    expect(dialogRef.close).toHaveBeenCalled();
    fixture.destroy();
    expect(draftService.save.mock.calls.at(-1)![0].amountText).toBe('3,5');
  });
});
