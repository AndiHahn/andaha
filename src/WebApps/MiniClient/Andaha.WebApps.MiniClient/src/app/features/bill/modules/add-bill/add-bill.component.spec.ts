import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { AnalyzedBillContextService } from 'src/app/features/bill-analysis/services/analyzed-bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ErrorSnackbarComponent } from 'src/app/shared/snackbar/error-snackbar/error-snackbar.component';
import { SuccessSnackbarComponent } from 'src/app/shared/snackbar/success-snackbar/success-snackbar.component';
import { BillCreatePrefill } from '../../models/bill-create-prefill';
import { QuickEntryDraftService } from '../../quick-entry/quick-entry-draft.service';
import { BillContextService } from '../../services/bill-context.service';
import { PrefillImageStore } from '../../services/prefill-image-store.service';
import { ShopStatsContextService } from '../../services/shop-stats-context.service';
import { AddBillComponent } from './add-bill.component';

const categories: CategoryDto[] = [
  {
    id: 'c1', name: 'Lebensmittel', color: '#7FB89A', order: 0, includeToStatistics: true, isDefault: false,
    subCategories: [{ id: 's1', name: 'Gebäck', order: 0 }]
  },
  {
    id: 'c2', name: 'Freizeit', color: '#8AA6D9', order: 1, includeToStatistics: true, isDefault: false,
    subCategories: []
  }
];

const lastCategories: Record<string, { categoryId: string; subCategoryId: string | null }> = {
  'billa': { categoryId: 'c1', subCategoryId: 's1' },
  'bäcker ruetz': { categoryId: 'c2', subCategoryId: null }
};

async function png(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
  return new File([blob], 'photo.png', { type: 'image/png' });
}

interface SetupOptions {
  prefill?: BillCreatePrefill;
  /** Foto, das Scan bzw. Übernahme im Speicher übergeben (Schlüssel kommt in den Router-State) */
  image?: File;
  apiAddBill?: () => Observable<unknown>;
  deleteAnalyzedBill?: () => Observable<void>;
}

describe('AddBillComponent', () => {
  let fixture: ComponentFixture<AddBillComponent>;
  let component: AddBillComponent;
  let host: HTMLElement;
  let addBill: ReturnType<typeof vi.fn>;
  let showAddedBill: ReturnType<typeof vi.fn>;
  let apiAddBill: ReturnType<typeof vi.fn>;
  let deleteAnalyzedBill: ReturnType<typeof vi.fn>;
  let refreshAnalyzed: ReturnType<typeof vi.fn>;
  let removeAnalyzed: ReturnType<typeof vi.fn>;
  let recordLocal: ReturnType<typeof vi.fn>;
  let clearDraft: ReturnType<typeof vi.fn>;
  let leaveTo: ReturnType<typeof vi.fn>;
  let register: ReturnType<typeof vi.fn>;
  let openSnackbar: ReturnType<typeof vi.spyOn>;
  let vibrate: ReturnType<typeof vi.spyOn>;

  async function setup(options: SetupOptions = {}): Promise<void> {
    history.replaceState(options.prefill ? { prefill: options.prefill } : null, '');

    addBill = vi.fn(() => Promise.resolve());
    showAddedBill = vi.fn();
    apiAddBill = vi.fn(options.apiAddBill ?? (() => of({})));
    deleteAnalyzedBill = vi.fn(options.deleteAnalyzedBill ?? (() => of(undefined)));
    refreshAnalyzed = vi.fn();
    removeAnalyzed = vi.fn();
    recordLocal = vi.fn();
    clearDraft = vi.fn();
    leaveTo = vi.fn();
    register = vi.fn(() => () => undefined);

    TestBed.configureTestingModule({
      imports: [AddBillComponent],
      providers: [
        provideRouter([]),
        { provide: BillContextService, useValue: { addBill, showAddedBill } },
        { provide: BillCategoryContextService, useValue: { categories: () => of(categories) } },
        {
          provide: ShopStatsContextService,
          useValue: {
            shopNames: (prefix = '') => ['Billa', 'Bäcker Ruetz'].filter(n => n.toLowerCase().startsWith(prefix.trim().toLowerCase())),
            lastCategoryFor: (name: string) => lastCategories[name.trim().toLowerCase()],
            recordLocal
          }
        },
        { provide: BillApiService, useValue: { addBill: apiAddBill, deleteAnalyzedBill } },
        { provide: AnalyzedBillContextService, useValue: { refresh: refreshAnalyzed, remove: removeAnalyzed } },
        { provide: QuickEntryDraftService, useValue: { clear: clearDraft } },
        { provide: OverlayBackService, useValue: { register } },
        { provide: HistoryTrailService, useValue: { leaveTo } }
      ]
    });

    if (options.image) {
      const imageKey = TestBed.inject(PrefillImageStore).put(options.image);
      history.replaceState({ prefill: { ...options.prefill, imageKey } }, '');
    }

    // keine echten Snackbars: deren Zeitgeber halten whenStable() sonst 4–5 s auf
    openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    fixture = TestBed.createComponent(AddBillComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement;
    await settle();
  }

  afterEach(() => {
    history.replaceState(null, '');
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function input(name: string): HTMLInputElement {
    return host.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  }

  async function type(name: string, value: string): Promise<void> {
    const el = input(name);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input'));
    await settle();
  }

  function saveButton(): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  async function save(): Promise<void> {
    saveButton().click();
    await settle();
    await vi.waitFor(() => expect(leaveTo.mock.calls.length + openSnackbar.mock.calls.length).toBeGreaterThan(0));
    await settle();
  }

  async function chooseOption(trigger: HTMLElement, text: string): Promise<void> {
    trigger.click();
    await settle();
    const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option'))
      .find(o => o.textContent!.trim() === text);
    if (!option) {
      throw new Error(`No option "${text}"`);
    }
    option.click();
    await settle();
  }

  async function pickShop(query: string, name: string): Promise<void> {
    await type('shopName', query);
    const option = Array.from(document.querySelectorAll<HTMLElement>('.mat-mdc-autocomplete-panel mat-option'))
      .find(o => o.textContent!.trim() === name);
    if (!option) {
      throw new Error(`No shop option "${name}"`);
    }
    option.click();
    await settle();
  }

  async function fillValid(): Promise<void> {
    await type('price', '12,5');
    await pickShop('Bi', 'Billa');
  }

  function savedDto(): BillCreateDto {
    return addBill.mock.calls[0][0] as BillCreateDto;
  }

  it('puts the price first, focused, with decimal keyboard', async () => {
    await setup();

    const first = host.querySelector('form input, form textarea, form mat-select')!;
    expect(first.getAttribute('name')).toBe('price');
    expect(first.getAttribute('inputmode')).toBe('decimal');
    expect(document.activeElement).toBe(first);
  });

  it('accepts a comma amount and saves it as number', async () => {
    await setup();

    await fillValid();
    await save();

    expect(savedDto().price).toBe(12.5);
    expect(savedDto().shopName).toBe('Billa');
  });

  it('big form shows "Pflichtfeld" and "Betrag größer 0"', async () => {
    await setup();
    const error = (name: string) => input(name).closest('.field')!.querySelector('.field-error')?.textContent?.trim();

    // vor der ersten Eingabe keine Fehler
    expect(host.querySelector('.field-error')).toBeNull();

    await type('price', '0');
    input('price').dispatchEvent(new Event('blur'));
    await settle();
    expect(error('price')).toBe('Betrag größer 0');

    await type('price', '');
    await settle();
    expect(error('price')).toBe('Pflichtfeld');

    await type('shopName', '   ');
    input('shopName').dispatchEvent(new Event('blur'));
    await settle();
    expect(error('shopName')).toBe('Pflichtfeld');

    component.form.controls.category.markAsTouched();
    await settle();
    const categoryField = host.querySelector('mat-select[formControlName="category"]')!.closest('.field')!;
    expect(categoryField.querySelector('.field-error')?.textContent?.trim()).toBe('Pflichtfeld');

    await type('price', '12,5');
    expect(error('price')).toBeUndefined();
  });

  it('blocks saving while the amount is invalid', async () => {
    await setup();
    await pickShop('Bi', 'Billa');

    for (const value of ['', 'abc', '0', '12,345']) {
      await type('price', value);
      expect(saveButton().disabled).toBe(true);
    }
    await type('price', '12,5');
    expect(saveButton().disabled).toBe(false);
  });

  it('prefills category and subcategory from the last use of the chosen shop', async () => {
    await setup();

    await pickShop('Bi', 'Billa');
    expect(component.form.controls.category.value?.id).toBe('c1');
    expect(component.form.controls.subCategory.value?.id).toBe('s1');

    await pickShop('Bä', 'Bäcker Ruetz');
    expect(component.form.controls.category.value?.id).toBe('c2');
    expect(component.form.controls.subCategory.value).toBeNull();
  });

  it('keeps a category chosen by hand when a shop is picked', async () => {
    await setup();

    await chooseOption(host.querySelector<HTMLElement>('mat-select[aria-label="Kategorie"] .mat-mdc-select-trigger')!, 'Freizeit');
    await pickShop('Bi', 'Billa');

    expect(component.form.controls.category.value?.id).toBe('c2');
  });

  it('fills all fields from the prefill including the photo', async () => {
    const photo = await png(20, 10);
    await setup({
      prefill: { price: 23.4, shopName: 'Billa', categoryId: 'c1', subCategoryId: 's1', date: '2026-10-30', notes: 'Wochenmarkt' },
      image: photo
    });

    expect(input('price').value).toBe('23,40');
    expect(input('shopName').value).toBe('Billa');
    expect(component.form.controls.category.value?.id).toBe('c1');
    expect(component.form.controls.subCategory.value?.id).toBe('s1');
    expect(host.querySelector<HTMLTextAreaElement>('textarea[name="notes"]')!.value).toBe('Wochenmarkt');
    expect(host.querySelector('app-photo-picker img')).toBeTruthy();

    await save();

    const dto = savedDto();
    expect(dto.price).toBe(23.4);
    expect(dto.date).toEqual(new Date(2026, 9, 30));
    expect(dto.notes).toBe('Wochenmarkt');
    expect(dto.categoryId).toBe('c1');
    expect(dto.subCategoryId).toBe('s1');
    expect(dto.image?.type).toBe('image/jpeg');
  });

  it('keeps a prefilled category when a shop is picked', async () => {
    await setup({ prefill: { categoryId: 'c2' } });

    await pickShop('Bi', 'Billa');

    expect(component.form.controls.category.value?.id).toBe('c2');
  });

  // design.md §9: das Foto liegt nur im Speicher; nach Neuladen ist es weg, das Formular geht ohne
  it('opens without the photo after a reload (image key no longer known) and still saves', async () => {
    await setup({ prefill: { imageKey: 'vor-dem-neuladen' } });

    expect(host.querySelector('app-photo-picker img')).toBeNull();

    await fillValid();
    await save();

    expect(addBill).toHaveBeenCalledTimes(1);
    expect(savedDto().image).toBeUndefined();
    expect(leaveTo).toHaveBeenCalledWith('/bill/list');
  });

  it('after saving: snackbar without action, vibration, back to the list', async () => {
    await setup();

    await fillValid();
    await save();

    expect(addBill).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'c1', subCategoryId: 's1' }),
      expect.objectContaining({ id: 'c1' }),
      expect.objectContaining({ id: 's1' }));
    expect(openSnackbar).toHaveBeenCalledWith(SuccessSnackbarComponent, expect.objectContaining({ data: 'Gespeichert · Billa 12,50 €' }));
    expect(vibrate).toHaveBeenCalledWith(30);
    // I2: zurück zur Liste, von der das Formular geöffnet wurde (genau ein Listen-Eintrag)
    expect(leaveTo).toHaveBeenCalledWith('/bill/list');
    expect(recordLocal).toHaveBeenCalledWith('Billa', 'c1', 's1', expect.any(Date));
    expect(clearDraft).not.toHaveBeenCalled();
  });

  it('clears the quick entry draft after saving values from „Alle Felder“', async () => {
    await setup({ prefill: { price: 4.2, date: '2026-10-30', fromQuickEntry: true } });

    await pickShop('Bi', 'Billa');
    await save();

    expect(clearDraft).toHaveBeenCalled();
  });

  it('keeps the quick entry draft when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await setup({ prefill: { price: 4.2, fromQuickEntry: true } });
    addBill.mockRejectedValue(new Error('kaputt'));

    await pickShop('Bi', 'Billa');
    await save();

    expect(clearDraft).not.toHaveBeenCalled();
    expect(leaveTo).not.toHaveBeenCalled();
    expect(openSnackbar).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Rechnung konnte nicht gespeichert werden.' }));
  });

  // I3: Zurück mit offener Auswahl schließt nur die Auswahl, das Formular bleibt
  it('registers an open category select with the back handling', async () => {
    await setup();

    host.querySelector<HTMLElement>('mat-select[aria-label="Kategorie"] .mat-mdc-select-trigger')!.click();
    await settle();
    expect(document.querySelector('mat-option')).toBeTruthy();
    expect(register).toHaveBeenCalledTimes(1);

    (register.mock.calls[0][0] as () => void)();
    await settle();
    await vi.waitFor(() => expect(document.querySelector('.mat-mdc-select-panel')).toBeNull());
    expect(leaveTo).not.toHaveBeenCalled();
  });

  it('keeps the bill id of the form for a second attempt', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await setup();
    addBill.mockRejectedValueOnce(new Error('kaputt'));

    await fillValid();
    await save();
    openSnackbar.mockClear();
    await save();

    expect(addBill).toHaveBeenCalledTimes(2);
    expect((addBill.mock.calls[1][0] as BillCreateDto).id).toBe((addBill.mock.calls[0][0] as BillCreateDto).id);
  });

  describe('taking over an analyzed bill', () => {
    const prefill: BillCreatePrefill = { analyzedBillId: 'a1', price: 9.9, shopName: 'Billa', categoryId: 'c1', date: '2026-10-30' };

    it('saves online first, then deletes the analyzed entry', async () => {
      await setup({ prefill });

      await save();

      expect(addBill).not.toHaveBeenCalled();
      expect(apiAddBill).toHaveBeenCalledWith(expect.objectContaining({ price: 9.9, shopName: 'Billa' }));
      expect(deleteAnalyzedBill).toHaveBeenCalledWith('a1');
      expect(apiAddBill.mock.invocationCallOrder[0]).toBeLessThan(deleteAnalyzedBill.mock.invocationCallOrder[0]);
      expect(refreshAnalyzed).toHaveBeenCalled();
      // Re-Review N1: sofort aus dem Kontext, bevor die Seite verlassen wird
      expect(removeAnalyzed).toHaveBeenCalledWith('a1');
      expect(removeAnalyzed.mock.invocationCallOrder[0]).toBeLessThan(leaveTo.mock.invocationCallOrder[0]);
      expect(showAddedBill).toHaveBeenCalled();
      expect(openSnackbar).toHaveBeenCalledWith(SuccessSnackbarComponent, expect.objectContaining({ data: 'Gespeichert · Billa 9,90 €' }));
      // I1/I2: zurück zur Analyse-Liste, über den gelöschten Analyse-Eintrag hinweg
      expect(leaveTo).toHaveBeenCalledWith('/bill/analysis', 2);
    });

    it('takes the photo over from memory', async () => {
      await setup({ prefill, image: await png(20, 10) });

      await save();

      expect((apiAddBill.mock.calls[0][0] as BillCreateDto).image?.type).toBe('image/jpeg');
      expect(deleteAnalyzedBill).toHaveBeenCalledWith('a1');
    });

    // design.md §9: nach Neuladen ist das Foto weg; die Analyse samt Foto bleibt dann bestehen und
    // das Formular legt eine normale Rechnung an, statt das Foto mit der Analyse zu löschen
    it('keeps the analyzed entry when its photo was lost by a reload', async () => {
      await setup({ prefill: { ...prefill, imageKey: 'vor-dem-neuladen' } });

      await save();

      expect(apiAddBill).not.toHaveBeenCalled();
      expect(deleteAnalyzedBill).not.toHaveBeenCalled();
      expect(savedDto()).toEqual(expect.objectContaining({ price: 9.9, shopName: 'Billa' }));
      expect(leaveTo).toHaveBeenCalledWith('/bill/list');
    });

    it('does not delete the analyzed entry when saving fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await setup({ prefill, apiAddBill: () => throwError(() => new HttpErrorResponse({ status: 500 })) });

      await save();

      expect(deleteAnalyzedBill).not.toHaveBeenCalled();
      expect(leaveTo).not.toHaveBeenCalled();
      expect(openSnackbar).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Rechnung konnte nicht gespeichert werden.' }));
    });

    it('needs a connection', async () => {
      await setup({ prefill });
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      await save();

      expect(apiAddBill).not.toHaveBeenCalled();
      expect(deleteAnalyzedBill).not.toHaveBeenCalled();
      expect(openSnackbar).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Zum Übernehmen wird eine Verbindung gebraucht' }));
    });

    it('reports a lost connection while saving like offline', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await setup({ prefill, apiAddBill: () => throwError(() => new HttpErrorResponse({ status: 0 })) });

      await save();

      expect(deleteAnalyzedBill).not.toHaveBeenCalled();
      expect(openSnackbar).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Zum Übernehmen wird eine Verbindung gebraucht' }));
    });

    // M2: ging die Antwort verloren (Status 0), legt der zweite Versuch keine zweite Rechnung an
    it('sends the same bill id when saving is retried', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      let calls = 0;
      await setup({ prefill, apiAddBill: () => ++calls === 1 ? throwError(() => new HttpErrorResponse({ status: 0 })) : of({}) });

      await save();
      openSnackbar.mockClear();
      await save();

      expect(apiAddBill).toHaveBeenCalledTimes(2);
      const [first, second] = apiAddBill.mock.calls.map(call => (call[0] as BillCreateDto).id);
      expect(first).toEqual(expect.any(String));
      expect(second).toBe(first);
      expect(deleteAnalyzedBill).toHaveBeenCalledTimes(1);
    });

    it('keeps the saved bill when deleting the analyzed entry fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await setup({ prefill, deleteAnalyzedBill: () => throwError(() => new HttpErrorResponse({ status: 500 })) });

      await save();

      expect(leaveTo).toHaveBeenCalledWith('/bill/analysis', 2);
      expect(removeAnalyzed).not.toHaveBeenCalled();
      expect(refreshAnalyzed).toHaveBeenCalled();
      expect(openSnackbar).toHaveBeenCalledWith(ErrorSnackbarComponent,
        expect.objectContaining({ data: 'Rechnung gespeichert, die Analyse konnte aber nicht entfernt werden.' }));
    });
  });
});
