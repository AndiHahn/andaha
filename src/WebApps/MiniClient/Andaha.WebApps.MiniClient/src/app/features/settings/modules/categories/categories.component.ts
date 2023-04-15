import { Component, OnInit } from '@angular/core';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  categories?: CategoryDto[];
  tmpCategories?: CategoryDto[];

  isSaving: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  constructor(
    private categoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onEditClick(): void {
    this.tmpCategories = this.categories?.slice();

    this.isEditing = true;
  }

  onCancelClick(): void {
    if (this.tmpCategories) {
      this.categories = this.tmpCategories.slice();
    }

    this.isEditing = false;
  }

  onSaveClick(): void {
    
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
}
