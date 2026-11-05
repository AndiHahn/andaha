import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of } from 'rxjs';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { QuickEntryService } from '../../quick-entry/quick-entry.service';
import { ScanService } from '../../scan/scan.service';
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
  let totalSum$: BehaviorSubject<number>;
  let monthSums$: BehaviorSubject<Map<string, number>>;
  let loading$: BehaviorSubject<boolean>;
  let deleteBill: ReturnType<typeof vi.fn>;
  let refreshBills: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let confirmed: boolean;

  beforeEach(async () => {
    bills$ = new BehaviorSubject<BillDto[]>([
      bill('b1', new Date(2026, 10, 5), 48.2),
      bill('b2', new Date(2026, 10, 1, 0, 30), 185.9),
      bill('b3', new Date(2026, 9, 30), 23.15)
    ]);
    totalResults$ = new BehaviorSubject(126);
    totalSum$ = new BehaviorSubject(8412.3);
    monthSums$ = new BehaviorSubject(new Map([['2026-11', 312.4], ['2026-10', 820.25]]));
    loading$ = new BehaviorSubject(false);
    deleteBill = vi.fn(() => of(undefined));
    refreshBills = vi.fn();
    confirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(confirmed) }));

    const context: Partial<Record<keyof BillContextService, unknown>> = {
      bills: () => bills$.asObservable(),
      totalResults: () => totalResults$.asObservable(),
      totalSum$: totalSum$.asObservable(),
      monthSums$: monthSums$.asObservable(),
      pageSize: () => of(50),
      loading: () => loading$.asObservable(),
      lastAddedId: () => of(null),
      error: signal(false),
      retry: vi.fn(),
      getSearchText: () => '',
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
        { provide: ScanService, useValue: { start: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }
      ]
    });
    vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(BillListComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const text = (selector: string) => host.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  it('shows total line "126 Rechnungen" and sum', () => {
    expect(text('.sum')).toContain('126 Rechnungen');
    expect(text('.sum')).toContain('8.412,30 €');
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
    totalSum$.next(0);
    monthSums$.next(new Map());
    fixture.detectChanges();

    expect(host.querySelectorAll('.month-head').length).toBe(0);
    expect(text('.sum')).toContain('0 Rechnungen');
    expect(text('.sum')).toContain('0,00 €');
    expect(host.querySelector('app-load-state .empty')).not.toBeNull();
  });

  it('marks rows with data-no-swipe so tab swiping ignores them', () => {
    const rows = host.querySelectorAll('.swipe-row');
    expect(rows.length).toBe(3);
    rows.forEach(row => expect(row.hasAttribute('data-no-swipe')).toBe(true));
  });

  function swipe(row: HTMLElement, dx: number): void {
    const rect = row.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const touch = (clientX: number) => new Touch({ identifier: 1, target: row, clientX, clientY: y });
    row.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(x)], changedTouches: [touch(x)], bubbles: true }));
    row.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(x + dx)], changedTouches: [touch(x + dx)], bubbles: true }));
    row.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(x + dx)], bubbles: true }));
  }

  it('delete via swipe asks confirmation then deletes and vibrates', async () => {
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
    const row = host.querySelectorAll<HTMLElement>('.swipe-row')[0];

    swipe(row, -0.6 * row.getBoundingClientRect().width);
    await vi.waitFor(() => expect(deleteBill).toHaveBeenCalledWith('b1'));

    expect(openConfirmation).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(30);
    vibrate.mockRestore();
  });

  it('external bill: swipe left does not delete', async () => {
    bills$.next([{ ...bill('ext', new Date(2026, 10, 4), 12), isExternal: true }]);
    fixture.detectChanges();
    const row = host.querySelector<HTMLElement>('.swipe-row')!;
    expect(row.querySelector('.under-delete')).toBeNull();

    swipe(row, -0.6 * row.getBoundingClientRect().width);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve));

    expect(openConfirmation).not.toHaveBeenCalled();
    expect(deleteBill).not.toHaveBeenCalled();
    expect(row.querySelector<HTMLElement>('.swipe-content')!.style.transform).toBe('');
  });

  it('external bill: swipe right still duplicates', async () => {
    const navigate = TestBed.inject(Router).navigate as unknown as ReturnType<typeof vi.fn>;
    bills$.next([{ ...bill('ext', new Date(2026, 10, 4), 12), isExternal: true }]);
    fixture.detectChanges();
    const row = host.querySelector<HTMLElement>('.swipe-row')!;

    swipe(row, 0.6 * row.getBoundingClientRect().width);

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/bill/create'], expect.objectContaining({
      state: { prefill: expect.objectContaining({ shopName: 'Shop ext' }) }
    })));
  });

  it('does not delete when the confirmation is cancelled', async () => {
    confirmed = false;
    const row = host.querySelectorAll<HTMLElement>('.swipe-row')[0];

    swipe(row, -0.6 * row.getBoundingClientRect().width);
    await vi.waitFor(() => expect(openConfirmation).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve));

    expect(deleteBill).not.toHaveBeenCalled();
  });

  it('duplicate via swipe opens the large form with prefill', async () => {
    const navigate = TestBed.inject(Router).navigate as unknown as ReturnType<typeof vi.fn>;
    const row = host.querySelectorAll<HTMLElement>('.swipe-row')[2];

    swipe(row, 0.6 * row.getBoundingClientRect().width);

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/bill/create'], expect.objectContaining({
      state: { prefill: expect.objectContaining({ shopName: 'Shop b3', price: 23.15, categoryId: 'c1' }) }
    })));
  });

  it('a short swipe opens the row and a tap on "Löschen" asks confirmation', async () => {
    const row = host.querySelectorAll<HTMLElement>('.swipe-row')[1];

    swipe(row, -0.3 * row.getBoundingClientRect().width);
    fixture.detectChanges();
    expect(openConfirmation).not.toHaveBeenCalled();

    row.querySelector<HTMLButtonElement>('.under-delete button')!.click();
    await vi.waitFor(() => expect(deleteBill).toHaveBeenCalledWith('b2'));
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
});
