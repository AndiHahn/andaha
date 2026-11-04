import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { BillSuggestionDto } from 'src/app/api/shopping/dtos/BillSuggestionDto';
import { BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
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

/** Mehr → Vorlagen (v2, 03-vorlagen, Bild b): angeheftete Vorlagen sortieren, Vorschläge anheften. */
@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatProgressSpinner, CdkDropList, CdkDrag, CdkDragHandle, MatIcon, RouterLink]
})
export class TemplateListComponent {
  private snackbar = inject(MatSnackBar);
  private templateContext = inject(BillTemplateContextService);

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

  retry(): void {
    this.templateContext.retry();
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
}
