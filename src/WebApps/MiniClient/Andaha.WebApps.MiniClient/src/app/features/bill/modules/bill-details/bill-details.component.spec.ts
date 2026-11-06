import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillUpdateDto } from 'src/app/api/shopping/dtos/BillUpdateDto';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { BillDetailsComponent } from './bill-details.component';

describe('BillDetailsComponent', () => {
  let fixture: ComponentFixture<BillDetailsComponent>;
  let host: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;
  let deleteBill: ReturnType<typeof vi.fn>;
  let leaveTo: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let getBill: ReturnType<typeof vi.fn>;
  let updateBill: ReturnType<typeof vi.fn>;

  const route = (q?: string) => ({
    snapshot: { params: { id: 'b1' }, children: [], parent: null, queryParamMap: convertToParamMap(q ? { q } : {}) }
  });
  const items = [
    { id: 'l1', description: 'Milch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 },
    { id: 'l2', description: 'Brot', totalPrice: 3.42 }
  ];

  const bill: BillDto = {
    id: 'b1',
    category: { id: 'c1', name: 'Lebensmittel', color: '#3B7D4F', order: 0 },
    subCategory: { id: 's1', name: 'Gebäck', order: 0 },
    shopName: 'Bäckerei Ströck',
    price: 6.4,
    notes: 'Frühstück',
    date: new Date(2026, 9, 3),
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: true
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 5, 9, 0));

    deleteBill = vi.fn(() => of(undefined));
    getBill = vi.fn(() => of({ ...bill, lineItems: items }));
    updateBill = vi.fn(() => of(undefined));
    leaveTo = vi.fn();
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(true) }));

    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        {
          provide: BillContextService,
          useValue: { loadBillById: () => of({ ...bill }), loading: () => of(false), deleteBill, updateBill }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const button = (text: string) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('.actions button')).find(b => b.textContent?.includes(text))!;

  it('duplicate navigates to /bill/create with prefill', () => {
    button('Duplizieren').click();

    expect(navigate).toHaveBeenCalledWith(['/bill/create'], {
      state: {
        prefill: {
          price: 6.4,
          shopName: 'Bäckerei Ströck',
          categoryId: 'c1',
          subCategoryId: 's1',
          notes: 'Frühstück',
          date: '2026-11-05'
        }
      }
    });
  });

  it('external bill: "Löschen" is disabled', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        {
          provide: BillContextService,
          useValue: { loadBillById: () => of({ ...bill, isExternal: true }), loading: () => of(false), deleteBill }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    expect(button('Löschen').disabled).toBe(true);
    expect(button('Duplizieren').disabled).toBe(false);
  });

  it('loads items via getBillById after reload', () => {
    expect(getBill).toHaveBeenCalledWith('b1');
    const text = host.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('2 × 1,49 €');
    expect(text).toContain('Summe der Positionen: 6,40 €');
    expect(host.querySelector('.deviation')).toBeNull();
  });

  it('keeps the detail usable when loading the items fails', () => {
    TestBed.resetTestingModule();
    getBill = vi.fn(() => throwError(() => new Error('x')));
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: BillContextService, useValue: { loadBillById: () => of({ ...bill }), loading: () => of(false), deleteBill } },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    expect(host.textContent).toContain('Bäckerei Ströck');
    expect(host.querySelector('app-line-items-view')?.textContent?.trim()).toBe('');
  });

  it('bill known from the list whose detail returns 404 leaves as not found and drops it from the list', () => {
    TestBed.resetTestingModule();
    getBill = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));
    const forgetBill = vi.fn();
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: BillContextService, useValue: { loadBillById: () => of({ ...bill }), loading: () => of(false), deleteBill, forgetBill, isPendingSync: () => false } },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    const openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    expect(forgetBill).toHaveBeenCalledWith('b1');
    expect(leaveTo).toHaveBeenCalledWith('/bill/list');
    expect(openSnackbar.mock.calls.map(call => (call[1] as { data: unknown }).data))
      .toContainEqual(expect.objectContaining({ message: 'Eintrag wurde nicht gefunden.' }));
  });

  it('a pending local bill whose detail returns 404 stays and keeps the detail usable', () => {
    TestBed.resetTestingModule();
    getBill = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })));
    const forgetBill = vi.fn();
    const isPendingSync = vi.fn((id: string) => id === 'b1');
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        {
          provide: BillContextService,
          useValue: { loadBillById: () => of({ ...bill }), loading: () => of(false), deleteBill, forgetBill, isPendingSync }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    const openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    // US-0005: noch nicht übertragen, der Server kennt sie (noch) nicht – kein „nicht gefunden“
    expect(isPendingSync).toHaveBeenCalledWith('b1');
    expect(forgetBill).not.toHaveBeenCalled();
    expect(leaveTo).not.toHaveBeenCalled();
    expect(openSnackbar).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Bäckerei Ströck');
    expect(button('Löschen').disabled).toBe(false);
  });

  it('partner bill shows items read-only', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route('brot') },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: BillContextService, useValue: { loadBillById: () => of({ ...bill, isExternal: true }), loading: () => of(false), deleteBill } },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    expect(host.querySelectorAll('.line-item').length).toBe(2);
    expect(host.querySelectorAll('.line-item.match').length).toBe(1);
    expect(host.querySelector('app-line-items-view input')).toBeNull();
    expect(button('Löschen').disabled).toBe(true);
  });

  function recreate(shown: BillDto): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route() },
        { provide: BillApiService, useValue: { getBill } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: BillContextService, useValue: { loadBillById: () => of({ ...shown }), loading: () => of(false), deleteBill, updateBill } },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const editRows = () => Array.from(host.querySelectorAll<HTMLElement>('app-line-items-editor .edit-row'));
  const description = (row: HTMLElement) => row.querySelector<HTMLInputElement>('input[aria-label="Beschreibung"]')!;

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
  }

  it('edit mode shows editor for own bill only', async () => {
    button('Bearbeiten').click();
    await settle();

    expect(editRows().length).toBe(2);
    expect(description(editRows()[0]).value).toBe('Milch');
    expect(host.querySelector('app-line-items-view')).toBeNull();

    recreate({ ...bill, isExternal: true });
    button('Bearbeiten').click();
    await settle();

    expect(host.querySelector('app-line-items-editor')).toBeNull();
    // Partner-Rechnung: Positionen bleiben nur lesend sichtbar (design.md §5.3)
    expect(host.querySelectorAll('app-line-items-view .line-item').length).toBe(2);
    expect(host.querySelector('app-line-items-view input')).toBeNull();
  });

  it('save sends lineItems JSON', async () => {
    button('Bearbeiten').click();
    await settle();

    await type(description(editRows()[0]), 'Vollmilch');
    editRows()[1].querySelector<HTMLButtonElement>('button[aria-label="Position entfernen"]')!.click();
    await settle();
    button('Speichern').click();
    await settle();

    expect(updateBill).toHaveBeenCalledTimes(1);
    const dto = updateBill.mock.calls[0][1] as BillUpdateDto;
    expect(JSON.parse(JSON.stringify(dto.lineItems))).toEqual([
      { description: 'Vollmilch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 }
    ]);
    // nach dem Speichern zeigt die Ansicht den neuen Stand
    expect(host.querySelectorAll('app-line-items-view .line-item').length).toBe(1);
    expect(host.querySelector('app-line-items-view')!.textContent).toContain('Vollmilch');
  });

  // Ersetzen beim Server: unberührte Positionen nicht mitschicken, sonst überschreibt der Stand beim
  // Öffnen neuere Positionen eines anderen Geräts
  it('save without touching items omits lineItems', async () => {
    button('Bearbeiten').click();
    await settle();

    const shop = host.querySelector<HTMLInputElement>('input[formControlName="shopName"]')!;
    await type(shop, 'Ströck');
    button('Speichern').click();
    await settle();

    expect(updateBill).toHaveBeenCalledTimes(1);
    const dto = updateBill.mock.calls[0][1] as BillUpdateDto;
    expect(dto.shopName).toBe('Ströck');
    expect(dto.lineItems).toBeUndefined();
    expect(host.querySelectorAll('app-line-items-view .line-item').length).toBe(2);
  });

  it('removing a row alone counts as an edit', async () => {
    button('Bearbeiten').click();
    await settle();

    editRows()[0].querySelector<HTMLButtonElement>('button[aria-label="Position entfernen"]')!.click();
    await settle();
    button('Speichern').click();
    await settle();

    expect((updateBill.mock.calls[0][1] as BillUpdateDto).lineItems).toEqual([
      { description: 'Brot', quantity: null, unitPrice: null, totalPrice: 3.42 }
    ]);
  });

  it('an edit is forgotten after cancel and after saving', async () => {
    button('Bearbeiten').click();
    await settle();
    await type(description(editRows()[0]), 'Semmel');
    button('Abbrechen').click();
    await settle();

    button('Bearbeiten').click();
    await settle();
    button('Speichern').click();
    await settle();
    expect((updateBill.mock.calls[0][1] as BillUpdateDto).lineItems).toBeUndefined();

    button('Bearbeiten').click();
    await settle();
    await type(description(editRows()[0]), 'Semmel');
    button('Speichern').click();
    await settle();
    expect((updateBill.mock.calls[1][1] as BillUpdateDto).lineItems).toHaveLength(2);

    button('Bearbeiten').click();
    await settle();
    button('Speichern').click();
    await settle();
    expect((updateBill.mock.calls[2][1] as BillUpdateDto).lineItems).toBeUndefined();
  });

  it('save is blocked while a line item is invalid', async () => {
    button('Bearbeiten').click();
    await settle();

    await type(description(editRows()[0]), '  ');
    button('Speichern').click();
    await settle();

    expect(updateBill).not.toHaveBeenCalled();
    expect(editRows()[0].querySelector('.field-error')?.textContent?.trim()).toBe('Pflichtfeld');
  });

  it('cancel restores items', async () => {
    button('Bearbeiten').click();
    await settle();

    editRows()[0].querySelector<HTMLButtonElement>('button[aria-label="Position entfernen"]')!.click();
    await type(description(editRows()[0]), 'Semmel');
    button('Abbrechen').click();
    await settle();

    expect(updateBill).not.toHaveBeenCalled();
    const text = host.querySelector('app-line-items-view')!.textContent!;
    expect(text).toContain('Milch');
    expect(text).toContain('Brot');

    button('Bearbeiten').click();
    await settle();
    expect(editRows().map(row => description(row).value)).toEqual(['Milch', 'Brot']);
  });

  // Positionen nicht geladen (z. B. offline): Speichern darf sie nicht mit [] löschen
  it('does not send lineItems when the items could not be loaded', async () => {
    getBill = vi.fn(() => throwError(() => new Error('x')));
    recreate(bill);

    button('Bearbeiten').click();
    await settle();
    expect(host.querySelector('app-line-items-editor')).toBeNull();

    button('Speichern').click();
    await settle();

    expect(updateBill).toHaveBeenCalledTimes(1);
    expect((updateBill.mock.calls[0][1] as BillUpdateDto).lineItems).toBeUndefined();
  });

  it('delete asks confirmation, deletes and vibrates', async () => {
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    button('Löschen').click();
    await vi.waitFor(() => expect(deleteBill).toHaveBeenCalledWith('b1'));

    expect(openConfirmation).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(30);
    expect(leaveTo).toHaveBeenCalledWith('/bill/list');
    vibrate.mockRestore();
  });
});
