import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, InjectionToken, NgZone, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatOption } from '@angular/material/core';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, catchError, combineLatest, filter, map, of, switchMap, take, timeout } from 'rxjs';
import { generateGuid } from 'src/app/api/functions/api-utils';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { MenuBackDirective } from 'src/app/core/overlay/menu-back.directive';
import { SheetDragDirective } from 'src/app/core/overlay/sheet-drag.directive';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';
import { BillCreatePrefill } from '../../models/bill-create-prefill';
import { BillContextService } from '../../services/bill-context.service';
import { BillTemplateContextService } from '../../services/bill-template-context.service';
import { ShopStatsContextService } from '../../services/shop-stats-context.service';
import { AmountKeypadComponent } from '../amount-keypad/amount-keypad.component';
import { AmountKey, formatAmount } from '../logic/amount-input';
import { QuickEntryDraft, restoreDraft } from '../logic/draft-store';
import { findDuplicate } from '../logic/duplicate';
import { QuickEntryState, fromDayKey, toDayKey } from '../logic/quick-entry-state';
import { QuickTile, buildTiles, suggestionTileKey } from '../logic/tiles';
import { QuickEntryDraftService } from '../quick-entry-draft.service';
import { QuickTilesComponent, SuggestionPress } from '../quick-tiles/quick-tiles.component';
import { QuickAmountComponent } from '../quick-amount/quick-amount.component';
import { QuickShopChoiceComponent } from '../quick-shop-choice/quick-shop-choice.component';
import { QuickOtherFieldsComponent } from '../quick-other-fields/quick-other-fields.component';
import { QuickDateRowComponent } from '../quick-date-row/quick-date-row.component';

/** Höchstens so viele Shops in der Shop-Auswahl (design.md §3), dahinter „Anderer …“ */
const MAX_SHOP_CHIPS = 5;
const MAX_SHOP_SUGGESTIONS = 6;
const DAY_BILLS_PAGE_SIZE = 100;

/** So lange wartet die Wiederherstellung eines Entwurfs höchstens auf Vorlagen, Vorschläge und Kategorien */
export const QUICK_ENTRY_RESTORE_TIMEOUT_MS = new InjectionToken<number>('QUICK_ENTRY_RESTORE_TIMEOUT_MS', {
  providedIn: 'root',
  factory: () => 4000
});

/** Ohne Uhrzeit gespeichert: Mitternacht in UTC (Datum ohne Zeit vom Server) oder lokal (Datum gewählt) */
function hasTime(date: Date): boolean {
  const utcMidnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  const localMidnight = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
  return !utcMidnight && !localMidnight;
}

/**
 * Schnellerfassung (v2 `02-schnellerfassung` a–g, AC8–AC19, AC21): mobil als Bottom Sheet mit eigener
 * Zifferntastatur, ab 1024 px als Dialog mit normalem Eingabefeld (geöffnet über QuickEntryService).
 */
@Component({
  selector: 'app-quick-entry-sheet',
  templateUrl: './quick-entry-sheet.component.html',
  styleUrls: ['./quick-entry-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '[class.dialog]': 'dialogMode' },
  imports: [
    MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MenuBackDirective, MatOption, MatAutocomplete, SheetDragDirective,
    AmountKeypadComponent, QuickAmountComponent, QuickTilesComponent, QuickShopChoiceComponent, QuickOtherFieldsComponent,
    QuickDateRowComponent
  ]
})
export class QuickEntrySheetComponent {
  readonly sheetRef = inject(MatBottomSheetRef, { optional: true });
  private readonly dialogRef = inject(MatDialogRef, { optional: true });
  /** Desktop (ab 1024 px): Dialog mit Eingabefeld statt Zifferntastatur */
  readonly dialogMode = !this.sheetRef && !!this.dialogRef;

  private readonly billContext = inject(BillContextService);
  private readonly billApi = inject(BillApiService);
  private readonly templateContext = inject(BillTemplateContextService);
  private readonly shopStats = inject(ShopStatsContextService);
  private readonly draftService = inject(QuickEntryDraftService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly state = new QuickEntryState();

  private readonly categoryContext = inject(BillCategoryContextService);
  readonly categories = toSignal(this.categoryContext.categories(), { initialValue: [] as CategoryDto[] });
  private readonly templates = toSignal(this.templateContext.templates(), { initialValue: [] });
  private readonly suggestions = toSignal(this.templateContext.suggestions(), { initialValue: [] });
  readonly tiles = computed(() => buildTiles(this.templates(), this.suggestions(), this.categories()));
  readonly selectedKey = computed(() => this.state.tile()?.key ?? null);

  // Shop-Auswahl bei Vorlagen ohne festen Shop (AC12)
  readonly showShopRow = computed(() => !this.state.other() && this.state.tile() !== null && this.state.tile()!.shopName === null);
  readonly shopChips = signal<string[]>([]);
  /** „Anderer …“ in der Shop-Auswahl: freies Feld statt Chip */
  readonly customShop = signal(false);
  /** Text im Shopfeld („Andere …“ bzw. „Anderer …“), steuert die Vorschläge */
  readonly shopQuery = signal('');
  readonly shopOptions = computed(() => this.shopStats.shopNames(this.shopQuery()).slice(0, MAX_SHOP_SUGGESTIONS));

  // „Andere …“ (AC13)
  readonly saveAsTemplate = signal(false);
  readonly selectedCategory = computed(() => this.categories().find(c => c.id === this.state.categoryId()) ?? null);
  readonly selectedSubCategoryName = computed(() =>
    this.selectedCategory()?.subCategories.find(s => s.id === this.state.subCategoryId())?.name ?? null);

  // Entwurf (AC18)
  readonly restored = signal(false);
  private pendingDraft: QuickEntryDraft | null = null;
  private saved = false;

  readonly saving = signal(false);

  readonly amountDisplay = computed(() => {
    const amount = this.state.amount();
    return !this.state.keypadOpen() && amount !== null ? formatAmount(amount) : this.state.amountText();
  });

  // Duplikat-Hinweis (AC17): Rechnungen des gewählten Tages, ohne Netz leer (Review Focus 5)
  private readonly dayBills = toSignal(
    toObservable(computed(() => toDayKey(this.state.date()))).pipe(switchMap(key => this.loadDayBills(key))),
    { initialValue: [] as BillDto[] });

  readonly duplicate = computed(() => {
    const amount = this.state.amount();
    const shopName = this.state.shopName();
    const category = this.selectedCategory();
    if (amount === null || !shopName || !category) {
      return null;
    }
    const match = findDuplicate(
      { shopName, price: amount, date: this.state.date(), categoryName: category.name, subCategoryName: this.selectedSubCategoryName() },
      this.dayBills());
    return match ?? null;
  });

  readonly duplicateText = computed(() => {
    const bill = this.duplicate();
    if (!bill) {
      return '';
    }
    const time = hasTime(bill.date) ? ` um ${formatDate(bill.date, 'HH:mm', 'de')}` : '';
    return `${bill.shopName} · ${formatAmount(bill.price)} €${time}. Trotzdem speichern?`;
  });

  // Kontextmenü eines Vorschlags (AC21)
  readonly menuTile = signal<QuickTile | null>(null);
  readonly menuTop = signal(0);
  private readonly menuTrigger = viewChild.required<MatMenuTrigger>('menuTrigger');

  constructor() {
    const draft = this.draftService.load();
    if (draft) {
      this.state.amountText.set(draft.amountText);
      this.state.date.set(fromDayKey(draft.date) ?? new Date());
      this.pendingDraft = draft;
      this.restored.set(true);

      // Auswahl des Entwurfs übernehmen, sobald Vorlagen, Vorschläge und Kategorien geladen sind; ohne
      // Backend (offline) nach einer Wartezeit mit dem, was da ist. Der Zeitgeber läuft außerhalb der Zone.
      // Wählt der Benutzer vorher selbst, verfällt die Auswahl des Entwurfs (pendingDraft = null).
      const zone = inject(NgZone);
      const ready$ = combineLatest([
        this.templateContext.loaded().pipe(filter(loaded => loaded)),
        this.categoryContext.categories().pipe(filter(categories => categories.length > 0))
      ]).pipe(
        take(1),
        map(() => true),
        timeout({ first: inject(QUICK_ENTRY_RESTORE_TIMEOUT_MS), with: () => of(false) }),
        takeUntilDestroyed());
      zone.runOutsideAngular(() => ready$.subscribe(() => zone.run(() => this.applyPendingDraft())));
    }

    // Gewählte Kachel verschwindet (z. B. Vorschlag gerade angeheftet): gleichwertige Kachel markieren
    effect(() => {
      const tiles = this.tiles();
      const current = untracked(() => this.state.tile());
      if (!current || tiles.some(t => t.key === current.key)) {
        return;
      }
      const same = tiles.find(t => t.categoryId === current.categoryId && t.subCategoryId === current.subCategoryId
        && (t.shopName ?? '').toLowerCase() === (current.shopName ?? '').toLowerCase());
      if (same) {
        untracked(() => this.state.tile.set(same));
      }
    });

    // Entwurf bei jeder Änderung schreiben; leer = keiner
    effect(() => {
      const draft = this.draftSnapshot();
      if (!this.saved) {
        untracked(() => this.persist(draft));
      }
    });

    inject(DestroyRef).onDestroy(() => {
      if (!this.saved) {
        this.persist(untracked(() => this.draftSnapshot()));
      }
    });
  }

  onKey(key: AmountKey): void {
    this.state.pressKey(key);
  }

  onAmountText(text: string): void {
    this.state.amountText.set(text);
  }

  onSelectTile(tile: QuickTile): void {
    this.pendingDraft = null;
    if (tile.key === this.selectedKey()) {
      return;
    }
    this.state.selectTile(tile);
    this.customShop.set(false);
    this.shopQuery.set('');
    if (tile.shopName === null) {
      this.prepareShopChoice(tile, null);
    }
  }

  onSelectShopChip(name: string): void {
    this.pendingDraft = null;
    this.customShop.set(false);
    this.state.selectShop(name);
  }

  onSelectCustomShop(): void {
    this.pendingDraft = null;
    this.customShop.set(true);
    this.state.selectShop(this.shopQuery());
  }

  onShopQuery(value: string): void {
    this.pendingDraft = null;
    this.shopQuery.set(value);
    this.state.selectShop(value);
  }

  onShopOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const name = event.option.value as string;
    this.shopQuery.set(name);
    this.state.selectShop(name);
    // „Andere …“: zuletzt für diesen Shop verwendete Kategorie vorbelegen, sofern noch keine gewählt
    if (this.state.other() && !this.state.categoryId()) {
      const last = this.shopStats.lastCategoryFor(name);
      if (last && this.categories().some(c => c.id === last.categoryId)) {
        this.state.selectCategory(last.categoryId, last.subCategoryId);
      }
    }
  }

  onSelectOther(): void {
    this.pendingDraft = null;
    this.state.selectOther();
    this.customShop.set(false);
    this.shopQuery.set('');
    this.saveAsTemplate.set(false);
  }

  onCategoryChange(categoryId: string | null): void {
    this.pendingDraft = null;
    this.state.selectCategory(categoryId, null);
  }

  onSubCategoryChange(subCategoryId: string | null): void {
    this.pendingDraft = null;
    this.state.selectCategory(this.state.categoryId(), subCategoryId);
  }

  onHeaderClose(): void {
    if (this.state.other()) {
      this.state.leaveOther();
      this.shopQuery.set('');
      this.saveAsTemplate.set(false);
    } else {
      this.close();
    }
  }

  discardDraft(): void {
    this.pendingDraft = null;
    this.restored.set(false);
    this.state.reset();
    this.customShop.set(false);
    this.shopQuery.set('');
    this.saveAsTemplate.set(false);
    this.shopChips.set([]);
    this.draftService.clear();
  }

  onDateChange(date: Date): void {
    this.state.date.set(date);
  }

  onSuggestionPress(press: SuggestionPress): void {
    const hostTop = this.host.getBoundingClientRect().top;
    this.menuTop.set(press.element.getBoundingClientRect().bottom - hostTop);
    this.menuTile.set(press.tile);
    this.menuTrigger().openMenu();
  }

  async pinSuggestion(tile: QuickTile): Promise<void> {
    const suggestion = this.suggestions().find(s => suggestionTileKey(s) === tile.key);
    if (!suggestion) {
      return;
    }
    try {
      await this.templateContext.pin(suggestion);
    } catch (error) {
      console.error('Pinning suggestion failed', error);
      openErrorSnackbar('Vorschlag konnte nicht angeheftet werden.', this.snackbar);
    }
  }

  async hideSuggestion(tile: QuickTile): Promise<void> {
    const suggestion = this.suggestions().find(s => suggestionTileKey(s) === tile.key);
    if (!suggestion) {
      return;
    }
    if (this.selectedKey() === tile.key) {
      this.state.tile.set(null);
      this.state.shopName.set(null);
    }
    try {
      await this.templateContext.hide(suggestion);
    } catch (error) {
      console.error('Hiding suggestion failed', error);
      openErrorSnackbar('Vorschlag konnte nicht ausgeblendet werden.', this.snackbar);
    }
  }

  openFullForm(): void {
    const prefill: BillCreatePrefill = { date: toDayKey(this.state.date()) };
    const amount = this.state.amount();
    if (amount !== null) {
      prefill.price = amount;
    }
    const shopName = this.state.shopName()?.trim();
    if (shopName) {
      prefill.shopName = shopName;
    }
    const categoryId = this.state.categoryId();
    if (categoryId) {
      prefill.categoryId = categoryId;
      prefill.subCategoryId = this.state.subCategoryId();
    }
    // Sheet/Dialog schließen nicht selbst bei Navigation (closeOnNavigation: false): erst zu, dann weiter
    this.close();
    void this.router.navigate(['/bill/create'], { state: { prefill } });
  }

  async save(): Promise<void> {
    if (this.saving() || !this.state.canSave()) {
      return;
    }
    const category = this.selectedCategory();
    const amount = this.state.amount();
    const shopName = this.state.shopName()?.trim();
    if (!category || amount === null || !shopName) {
      return;
    }
    const subCategory = category.subCategories.find(s => s.id === this.state.subCategoryId());
    const date = this.billDate();
    const dto: BillCreateDto = {
      id: generateGuid(),
      categoryId: category.id,
      subCategoryId: subCategory?.id,
      shopName,
      price: amount,
      date,
      notes: ''
    };
    const asTemplate = this.state.other() && this.saveAsTemplate();

    this.saving.set(true);
    try {
      await this.billContext.addBill(
        dto,
        { id: category.id, name: category.name, color: category.color, order: category.order },
        subCategory ? { id: subCategory.id, name: subCategory.name, order: subCategory.order } : undefined);
    } catch (error) {
      console.error('Saving bill failed', error);
      openErrorSnackbar('Rechnung konnte nicht gespeichert werden.', this.snackbar);
      this.saving.set(false);
      return;
    }

    this.saved = true;
    if (asTemplate) {
      // Rechnung ist gespeichert; schlägt die Vorlage fehl, meldet nur eine Snackbar das (design.md §3)
      this.templateContext.save(null, { shopName, categoryId: category.id, subCategoryId: subCategory?.id ?? null })
        .catch(error => {
          console.error('Saving template failed', error);
          openErrorSnackbar('Vorlage konnte nicht gespeichert werden.', this.snackbar);
        });
    }
    this.shopStats.recordLocal(shopName, category.id, subCategory?.id ?? null, date);
    this.draftService.clear();
    openSuccessSnackbar(`Gespeichert · ${shopName} ${formatAmount(amount)} €`, this.snackbar);
    vibrate(30);
    this.close();
  }

  close(): void {
    if (this.sheetRef) {
      this.sheetRef.dismiss();
    } else {
      this.dialogRef?.close();
    }
  }

  /** Heute: Zeitpunkt jetzt (wie das Formular bisher); anderer Tag: Tagesbeginn */
  private billDate(): Date {
    const date = this.state.date();
    if (toDayKey(date) === toDayKey(new Date())) {
      return new Date();
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private prepareShopChoice(tile: QuickTile, preferred: string | null): void {
    const chips = this.shopStats.frequentShops(tile.categoryId, tile.subCategoryId, MAX_SHOP_CHIPS);
    this.shopChips.set(chips);
    const wanted = preferred?.trim() ?? '';
    const chip = wanted ? chips.find(c => c.toLowerCase() === wanted.toLowerCase()) : chips[0];
    if (chip) {
      this.onSelectShopChip(chip);
    } else {
      // kein häufiger Shop oder ein eigener aus dem Entwurf: gleich das freie Feld
      this.shopQuery.set(wanted);
      this.onSelectCustomShop();
    }
  }

  private applyPendingDraft(): void {
    const draft = this.pendingDraft;
    if (draft) {
      this.applyDraftSelection(draft, this.categories(), this.tiles());
    }
  }

  private applyDraftSelection(draft: QuickEntryDraft, categories: CategoryDto[], tiles: QuickTile[]): void {
    this.pendingDraft = null;
    const valid = restoreDraft(draft, categories);
    if (valid.tileKey) {
      // Vorlage gelöscht oder Vorschlag verschwunden: Kachel fällt still weg (Review Focus 2)
      const tile = tiles.find(t => t.key === valid.tileKey);
      if (tile) {
        this.state.selectTile(tile);
        if (tile.shopName === null) {
          this.prepareShopChoice(tile, valid.shopName);
        }
      }
    } else if (valid.categoryId || valid.shopName) {
      this.state.selectOther();
      this.state.selectCategory(valid.categoryId, valid.subCategoryId);
      if (valid.shopName) {
        this.shopQuery.set(valid.shopName);
        this.state.selectShop(valid.shopName);
      }
      this.state.keypadOpen.set(this.state.amount() === null);
    }
    if (this.state.amountText() === '' && !this.state.tile() && !this.state.other()) {
      // nichts mehr übrig, was wiederhergestellt wäre
      this.restored.set(false);
    }
  }

  private draftSnapshot(): Omit<QuickEntryDraft, 'savedAt'> {
    const pending = this.pendingDraft;
    const tile = this.state.tile();
    return {
      amountText: this.state.amountText(),
      tileKey: pending ? pending.tileKey : tile?.key ?? null,
      shopName: pending ? pending.shopName : this.state.shopName(),
      categoryId: pending ? pending.categoryId : this.state.categoryId(),
      subCategoryId: pending ? pending.subCategoryId : this.state.subCategoryId(),
      date: toDayKey(this.state.date())
    };
  }

  private persist(draft: Omit<QuickEntryDraft, 'savedAt'>): void {
    const empty = draft.amountText === '' && draft.tileKey === null && !draft.shopName && !draft.categoryId;
    if (empty) {
      this.draftService.clear();
    } else {
      this.draftService.save(draft);
    }
  }

  private loadDayBills(dayKey: string): Observable<BillDto[]> {
    const from = fromDayKey(dayKey)!;
    const until = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
    return this.billApi.searchBills({ pageIndex: 0, pageSize: DAY_BILLS_PAGE_SIZE, fromDateFilter: from, untilDateFilter: until }).pipe(
      map(result => result.values),
      // ohne Netz kein Hinweis, Speichern bleibt möglich (Review Focus 5)
      catchError(() => of([] as BillDto[])));
  }
}
