import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, startWith } from 'rxjs';
import { generateGuid } from 'src/app/api/functions/api-utils';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillSubCategoryDto } from 'src/app/api/shopping/dtos/BillSubCategoryDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { AnalyzedBillContextService } from 'src/app/features/bill-analysis/services/analyzed-bill-context.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { ShowErrorPipe } from '../../../../shared/form-field/show-error.pipe';
import { CreateBillForm, getCreateBillForm } from '../../functions/bill-form-functions';
import { BillCreatePrefill, TAKE_OVER_OFFLINE } from '../../models/bill-create-prefill';
import { formatAmount, parseAmount } from '../../quick-entry/logic/amount-input';
import { fromDayKey, toDayKey } from '../../quick-entry/logic/quick-entry-state';
import { QuickDateRowComponent } from '../../quick-entry/quick-date-row/quick-date-row.component';
import { QuickEntryDraftService } from '../../quick-entry/quick-entry-draft.service';
import { ShopStatsContextService } from '../../services/shop-stats-context.service';
import { PhotoPickerComponent } from '../photo-picker/photo-picker.component';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

/** Desktop-Breakpoint wie AppComponent */
const DESKTOP = '(min-width: 1024px)';
const MAX_SHOP_OPTIONS = 6;

const SAVE_FAILED = 'Rechnung konnte nicht gespeichert werden.';
const ANALYSIS_KEPT = 'Rechnung gespeichert, die Analyse konnte aber nicht entfernt werden.';

/** Vorbelegung aus dem Router-State (`router.navigate(['/bill/create'], { state: { prefill } })`) */
function readPrefill(): BillCreatePrefill {
  const prefill = (history.state as { prefill?: unknown } | null)?.prefill;
  return prefill && typeof prefill === 'object' ? prefill as BillCreatePrefill : {};
}

/**
 * Großes Formular `/bill/create` (AC24–AC29, AC15, AC33): Preis zuerst mit Dezimaltastatur, Shop mit
 * Vervollständigung, Datum-Schnellwahl, Foto über Kamera/Galerie. Übernimmt die Vorbelegung aus
 * „Alle Felder“, dem Scan und „Als Rechnung übernehmen“.
 */
@Component({
    selector: 'app-add-bill',
    templateUrl: './add-bill.component.html',
    styleUrls: ['./add-bill.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, 
      ReactiveFormsModule, MatAutocomplete, MatAutocompleteTrigger, MatSelect, MatSelectTrigger, MatOption, MatIcon,
      ShowErrorPipe, QuickDateRowComponent, PhotoPickerComponent
    ]
})
export class AddBillComponent implements OnInit {
  private billContextService = inject(BillContextService);
  private billApi = inject(BillApiService);
  private analyzedBillContext = inject(AnalyzedBillContextService);
  private billCategoryContextService = inject(BillCategoryContextService);
  private shopStats = inject(ShopStatsContextService);
  private draftService = inject(QuickEntryDraftService);
  private snackbar = inject(MatSnackBar);
  private historyTrail = inject(HistoryTrailService);
  private destroyRef = inject(DestroyRef);

  readonly form: FormGroup<CreateBillForm> = getCreateBillForm();
  readonly prefill = readPrefill();
  /**
   * Einmal pro Formular (M2): ein zweiter Versuch nach verlorener Antwort legt keine zweite Rechnung an,
   * das Anlegen ist pro ID idempotent (CreateBillCommandHandler liefert die vorhandene zurück).
   */
  private readonly billId = generateGuid();
  /** Datepicker als Dialog (mobil) statt Popup */
  readonly touchUi = !inject(BreakpointObserver).isMatched(DESKTOP);

  allCategories: CategoryDto[] = [];
  billCategories: BillCategoryDto[] = [];
  billSubCategories: BillSubCategoryDto[] = [];
  shopOptions: string[] = [];
  photo: File | null = null;
  isSaving = false;

  /** Kategorie von Hand gewählt oder vorbelegt: die Shop-Auswahl überschreibt sie dann nicht (AC25) */
  private categoryChosen = false;
  private pendingCategory: { categoryId: string; subCategoryId: string | null } | null = null;

  private readonly priceInput = viewChild.required<ElementRef<HTMLInputElement>>('priceInput');

  readonly compareById = (a: { id: string } | null, b: { id: string } | null) => (a?.id ?? null) === (b?.id ?? null);

  constructor() {
    this.applyPrefill();
    afterNextRender(() => this.priceInput().nativeElement.focus());
  }

  ngOnInit(): void {
    this.billCategoryContextService.categories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(categories => {
      this.allCategories = categories;
      this.billCategories = categories.map(c => ({ id: c.id, name: c.name, color: c.color, order: c.order }));
      const selected = this.form.controls.category.value;
      this.billSubCategories = this.subCategoriesOf(selected?.id);

      const pending = this.pendingCategory;
      if (pending && categories.length > 0) {
        this.pendingCategory = null;
        this.selectCategory(pending.categoryId, pending.subCategoryId);
      }
    });

    this.form.controls.shopName.valueChanges.pipe(startWith(this.form.controls.shopName.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.updateShopOptions(value));
  }

  updateShopOptions(value = this.form.controls.shopName.value): void {
    this.shopOptions = this.shopStats.shopNames(value).slice(0, MAX_SHOP_OPTIONS);
  }

  onShopSelected(event: MatAutocompleteSelectedEvent): void {
    if (this.categoryChosen) {
      return;
    }
    const last = this.shopStats.lastCategoryFor(event.option.value as string);
    if (last) {
      this.selectCategory(last.categoryId, last.subCategoryId);
    }
  }

  categorySelectionChanged(): void {
    this.categoryChosen = true;
    this.form.controls.subCategory.setValue(null);
    this.billSubCategories = this.subCategoriesOf(this.form.controls.category.value?.id);
  }

  subCategorySelectionChanged(): void {
    this.categoryChosen = true;
  }

  onDateChange(date: Date): void {
    this.form.controls.date.setValue(date);
  }

  onPhotoSelected(photo: File): void {
    this.photo = photo;
  }

  onPhotoRemoved(): void {
    this.photo = null;
  }

  async onSubmit(): Promise<void> {
    const controls = this.form.controls;
    const price = parseAmount(controls.price.value);
    const category = controls.category.value;
    if (!this.form.valid || this.isSaving || price === null || !category) {
      return;
    }

    const subCategory = controls.subCategory.value ?? undefined;
    const shopName = controls.shopName.value.trim();
    const dto: BillCreateDto = {
      id: this.billId,
      categoryId: category.id,
      subCategoryId: subCategory?.id,
      shopName,
      price,
      date: this.billDate(),
      notes: controls.notes.value.trim()
    };

    this.isSaving = true;
    try {
      // Jedes Foto als JPEG ≤ 1600 px (AC29); schon verkleinerte bleiben unverändert
      dto.image = this.photo ? await compressImage(this.photo) : undefined;

      const analyzedBillId = this.prefill.analyzedBillId;
      const result = analyzedBillId
        ? await this.takeOver(dto, category, subCategory, analyzedBillId)
        : await this.saveLocal(dto, category, subCategory);
      if (result === 'failed') {
        return;
      }

      this.shopStats.recordLocal(shopName, category.id, subCategory?.id ?? null, dto.date);
      if (this.prefill.fromQuickEntry) {
        this.draftService.clear();
      }
      if (result === 'analysis-kept') {
        openErrorSnackbar(ANALYSIS_KEPT, this.snackbar);
      } else {
        openSuccessSnackbar(`Gespeichert · ${shopName} ${formatAmount(price)} €`, this.snackbar);
      }
      vibrate(30);
      this.leave();
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Zurück, woher das Formular kam (I2, design.md §9 „Zurück-Regeln“): Liste darunter → per Zurück
   * dorthin, sonst ersetzt die Liste das Formular. Übernahme: zur Analyse-Liste, über den nun
   * gelöschten Analyse-Eintrag hinweg (zwei Einträge zurück).
   */
  private leave(): void {
    if (this.prefill.analyzedBillId) {
      this.historyTrail.leaveTo('/bill/analysis', 2);
    } else {
      this.historyTrail.leaveTo('/bill/list');
    }
  }

  /** Normalfall: offline-first über den lokalen Speicher (BillCacheService) */
  private async saveLocal(dto: BillCreateDto, category: BillCategoryDto, subCategory?: BillSubCategoryDto): Promise<'saved' | 'failed'> {
    try {
      await this.billContextService.addBill(dto, category, subCategory);
      return 'saved';
    } catch (error) {
      console.error('Saving bill failed', error);
      openErrorSnackbar(SAVE_FAILED, this.snackbar);
      return 'failed';
    }
  }

  /**
   * „Als Rechnung übernehmen“ (design.md §5.2): direkt beim Server speichern und erst danach den
   * Analyse-Eintrag löschen. Ohne Netz wird nichts gespeichert und nichts gelöscht.
   */
  private async takeOver(
    dto: BillCreateDto,
    category: BillCategoryDto,
    subCategory: BillSubCategoryDto | undefined,
    analyzedBillId: string): Promise<'saved' | 'analysis-kept' | 'failed'> {
    if (!navigator.onLine) {
      openErrorSnackbar(TAKE_OVER_OFFLINE, this.snackbar);
      return 'failed';
    }

    try {
      await firstValueFrom(this.billApi.addBill(dto));
    } catch (error) {
      console.error('Taking over analyzed bill failed', error);
      const offline = error instanceof HttpErrorResponse && error.status === 0;
      openErrorSnackbar(offline ? TAKE_OVER_OFFLINE : SAVE_FAILED, this.snackbar);
      return 'failed';
    }
    this.billContextService.showAddedBill(dto, category, subCategory);

    try {
      await firstValueFrom(this.billApi.deleteAnalyzedBill(analyzedBillId), { defaultValue: undefined });
      return 'saved';
    } catch (error) {
      console.error('Deleting analyzed bill failed', error);
      return 'analysis-kept';
    } finally {
      this.analyzedBillContext.refresh();
    }
  }

  private applyPrefill(): void {
    const prefill = this.prefill;
    const controls = this.form.controls;

    if (typeof prefill.price === 'number' && prefill.price > 0) {
      controls.price.setValue(formatAmount(prefill.price));
    }
    if (prefill.shopName) {
      controls.shopName.setValue(prefill.shopName);
    }
    if (prefill.notes) {
      controls.notes.setValue(prefill.notes);
    }
    const date = prefill.date ? fromDayKey(prefill.date) : null;
    if (date) {
      controls.date.setValue(date);
    }
    if (prefill.image instanceof Blob) {
      this.photo = prefill.image;
    }
    if (prefill.categoryId) {
      this.categoryChosen = true;
      this.pendingCategory = { categoryId: prefill.categoryId, subCategoryId: prefill.subCategoryId ?? null };
    }
  }

  private selectCategory(categoryId: string, subCategoryId: string | null): void {
    const category = this.billCategories.find(c => c.id === categoryId);
    if (!category) {
      return;
    }
    this.form.controls.category.setValue(category);
    this.billSubCategories = this.subCategoriesOf(categoryId);
    this.form.controls.subCategory.setValue(this.billSubCategories.find(s => s.id === subCategoryId) ?? null);
  }

  private subCategoriesOf(categoryId: string | undefined): BillSubCategoryDto[] {
    const subCategories = this.allCategories.find(c => c.id === categoryId)?.subCategories ?? [];
    return subCategories.map(s => ({ id: s.id, name: s.name, order: s.order }));
  }

  /** Heute: Zeitpunkt jetzt (wie die Schnellerfassung); anderer Tag: Tagesbeginn */
  private billDate(): Date {
    const date = this.form.controls.date.value;
    if (toDayKey(date) === toDayKey(new Date())) {
      return new Date();
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
