import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { CategoryOrderDto } from 'src/app/api/shopping/dtos/CategoryOrderDto';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';

@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadStateComponent, MatProgressSpinner, CdkDropList, CdkDrag, CdkDragHandle, MatIcon, RouterLink, NgStyle]
})
export class CategoriesComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private categoryContextService = inject(BillCategoryContextService);
  private destroyRef = inject(DestroyRef);


  categories?: CategoryDto[];
  tmpCategories?: CategoryDto[];

  isSaving: boolean = false;
  isEditing: boolean = false;
  /** Die Liste wird mit den Kategorien geladen; vor dem ersten Laden ist sie leer (die Standardkategorie gibt es immer). */
  get loadState(): LoadState {
    if (this.categories?.length) {
      return 'ready';
    }
    return this.categoryContextService.error() ? 'error' : 'loading';
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onRetry(): void {
    this.categoryContextService.retry();
  }

  onEditClick(): void {
    this.tmpCategories = this.categories?.slice();

    this.isEditing = true;

    openInformationSnackbar('Kategorien können jetzt per "drag and drop" verschoben werden', this.snackbar);
  }

  onCancelClick(): void {
    if (this.tmpCategories) {
      this.categories = this.tmpCategories.slice();
    }

    this.isEditing = false;
  }

  onSaveClick(): void {
    this.isSaving = true;

    const dtos = this.createCategoryOrderDtos();

    this.categoryContextService.updateCategoryOrders(dtos).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.isEditing = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving = false;
          openErrorSnackbar("Reihenfolge der Kategorien konnte nicht gespeichert werden. (" + err.error + ")", this.snackbar);
        }
      }
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    if (!this.categories) {
      return;
    }
    
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
  }
  
  private initSubscriptions(): void {
    this.categoryContextService.categories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: categories => this.categories = categories
      }
    );
  }

  private createCategoryOrderDtos(): CategoryOrderDto[] {
    if (!this.categories) {
      return [];
    }

    return this.categories?.map((category, index) => this.createCategoryOrderDto(category.id, index));
  }

  private createCategoryOrderDto(id: string, order: number): CategoryOrderDto {
    return {
      categoryId: id,
      order: order
    }
  }
}
