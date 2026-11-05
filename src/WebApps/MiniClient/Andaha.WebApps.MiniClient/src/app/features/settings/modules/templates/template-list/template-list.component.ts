import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, filter, switchMap, take } from 'rxjs';
import { BillSuggestionDto } from 'src/app/api/shopping/dtos/BillSuggestionDto';
import { BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { HiddenBillSuggestionDto } from 'src/app/api/shopping/dtos/HiddenBillSuggestionDto';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { isSuggestionCovered } from 'src/app/features/bill/quick-entry/logic/tiles';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';

interface TemplateRow {
  id: string;
  title: string;
  subtitle: string;
  color: string | null;
}

interface SuggestionRow {
  suggestion: BillSuggestionDto;
  key: string;
  subtitle: string;
  color: string | null;
}

interface HiddenRow {
  hidden: HiddenBillSuggestionDto;
  subtitle: string;
  color: string | null;
}

/** Mehr → Vorlagen (v2, 03-vorlagen, Bild b): angeheftete Vorlagen sortieren, Vorschläge anheften. */
@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LoadStateComponent, CdkDropList, CdkDrag, CdkDragHandle, MatIcon, RouterLink]
})
export class TemplateListComponent {
  private snackbar = inject(MatSnackBar);
  private templateContext = inject(BillTemplateContextService);
  private destroyRef = inject(DestroyRef);

  private categories = toSignal(inject(BillCategoryContextService).categories(), { initialValue: [] as CategoryDto[] });
  private templates = toSignal(this.templateContext.templates(), { initialValue: [] as BillTemplateDto[] });
  private suggestionDtos = toSignal(this.templateContext.suggestions(), { initialValue: [] as BillSuggestionDto[] });

  readonly loaded = toSignal(this.templateContext.loaded(), { initialValue: false });
  readonly failed = toSignal(this.templateContext.loadFailed(), { initialValue: false });

  readonly rows = computed<TemplateRow[]>(() => this.templates()
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(t => {
      const category = this.categories().find(c => c.id === t.categoryId);
      const sub = category?.subCategories.find(s => s.id === t.subCategoryId);
      const parts = [category?.name ?? 'Kategorie fehlt', sub?.name];
      if (t.shopName == null && category) {
        parts.push('Shop beim Erfassen');
      }
      return {
        id: t.id,
        title: t.name || t.shopName || category?.name || 'Vorlage',
        subtitle: parts.filter(Boolean).join(' · '),
        color: category?.color ?? null
      };
    }));

  readonly suggestions = computed<SuggestionRow[]>(() => this.suggestionDtos().filter(s => !isSuggestionCovered(s, this.templates())).map(s => {
    const category = this.categories().find(c => c.id === s.categoryId);
    const sub = category?.subCategories.find(c => c.id === s.subCategoryId);
    return {
      suggestion: s,
      key: `${s.shopName}|${s.categoryId}|${s.subCategoryId ?? ''}`,
      subtitle: [category?.name ?? 'Kategorie fehlt', sub?.name].filter(Boolean).join(' · '),
      color: category?.color ?? null
    };
  }));

  /** Vorlagen und Vorschläge: Fehler nur, solange nichts zum Zeigen da ist (AC34) */
  readonly pageState = computed<LoadState>(() => {
    if (this.failed() && this.rows().length === 0 && this.suggestions().length === 0) {
      return 'error';
    }
    return this.loaded() ? 'ready' : 'loading';
  });

  // Abschnitt „Ausgeblendet“ (design.md §8.9): eigener Lade-, Fehler- und Leerzustand
  readonly hiddenEmptyText = 'Keine ausgeblendeten Vorschläge. „Nicht mehr vorschlagen“ in der Schnellerfassung blendet einen Vorschlag aus.';
  private readonly hidden = signal<HiddenBillSuggestionDto[] | null>(null);
  private readonly hiddenFailed = signal(false);
  /** Ids, deren „Wieder anzeigen“ gerade läuft (Button gesperrt) */
  readonly unhiding = signal<ReadonlySet<string>>(new Set());
  private hiddenRequest?: Subscription;

  readonly hiddenState = computed<LoadState>(() => {
    const hidden = this.hidden();
    if (this.hiddenFailed()) {
      return 'error';
    }
    if (hidden === null) {
      return 'loading';
    }
    return hidden.length > 0 ? 'ready' : 'empty';
  });

  readonly hiddenRows = computed<HiddenRow[]>(() => (this.hidden() ?? []).map(hidden => {
    const category = this.categories().find(c => c.id === hidden.categoryId);
    return {
      hidden,
      subtitle: [hidden.categoryName, hidden.subCategoryName].filter(Boolean).join(' · '),
      color: category?.color ?? null
    };
  }));

  constructor() {
    // wie Vorlagen und Vorschläge erst, wenn das Backend bereit ist (sonst schlägt der Kaltstart fehl)
    this.loadHidden(this.templateContext.loaded().pipe(
      filter(loaded => loaded),
      take(1),
      switchMap(() => this.templateContext.listHiddenSuggestions())));
  }

  retry(): void {
    this.templateContext.retry();
  }

  retryHidden(): void {
    this.loadHidden(this.templateContext.listHiddenSuggestions());
  }

  /** „Wieder anzeigen“: der Vorschlag verlässt den Abschnitt und erscheint wieder unter „Vorschläge“ */
  async unhide(row: HiddenRow): Promise<void> {
    // Doppeltipp während des DELETE: nur eine Anfrage
    if (this.unhiding().has(row.hidden.id)) {
      return;
    }
    this.unhiding.update(ids => new Set(ids).add(row.hidden.id));
    try {
      await this.templateContext.unhideSuggestion(row.hidden.id);
      this.hidden.update(hidden => hidden?.filter(h => h.id !== row.hidden.id) ?? null);
    } catch {
      openErrorSnackbar('Vorschlag konnte nicht wieder angezeigt werden.', this.snackbar);
    } finally {
      this.unhiding.update(ids => {
        const next = new Set(ids);
        next.delete(row.hidden.id);
        return next;
      });
    }
  }

  async drop(event: CdkDragDrop<TemplateRow[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const ids = this.rows().map(r => r.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    try {
      await this.templateContext.reorder(ids);
    } catch {
      openErrorSnackbar('Reihenfolge der Vorlagen konnte nicht gespeichert werden.', this.snackbar);
    }
  }

  async pin(row: SuggestionRow): Promise<void> {
    try {
      await this.templateContext.pin(row.suggestion);
    } catch {
      openErrorSnackbar('Vorschlag konnte nicht angeheftet werden.', this.snackbar);
    }
  }


  private loadHidden(hidden$: Observable<HiddenBillSuggestionDto[]>): void {
    this.hiddenRequest?.unsubscribe();
    this.hiddenFailed.set(false);
    this.hidden.set(null);
    this.hiddenRequest = hidden$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: hidden => this.hidden.set(hidden),
      error: () => this.hiddenFailed.set(true)
    });
  }
}
