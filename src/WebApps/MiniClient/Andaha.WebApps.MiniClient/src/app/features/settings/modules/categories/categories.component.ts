import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

@Component({
    selector: 'app-categories',
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, CdkDropList, CdkDrag, CdkDragHandle, MatIcon, RouterLink, NgStyle]
})
export class CategoriesComponent implements OnInit {

  categories?: CategoryDto[];
  tmpCategories?: CategoryDto[];

  isSaving: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  constructor(
    private snackbar: MatSnackBar,
    private categoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
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
    this.isLoading = true;
    
    this.categoryContextService.categories().subscribe(
      {
        next: categories => {
          if (categories) {
            this.categories = categories;
            this.isLoading = false;
          }
        },
        error: _ => this.isLoading = false
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
