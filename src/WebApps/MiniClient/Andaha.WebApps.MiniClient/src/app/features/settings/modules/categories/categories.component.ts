import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
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
    private snackbar: MatSnackBar,
    private confirmationDialogService: ConfirmationDialogService,
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

  onAddCategoryClick(): void {
    
  }

  drop(event: CdkDragDrop<string[]>) {
    if (!this.categories) {
      return;
    }
    
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
  }

  onSaveClick(): void {
    const dialogData: ConfirmationDialogData = {
      text: 'Wurden Kategorien gelöscht, die bereits für Rechnungen verwendet wurden, dann wird für diese die vorkonfigurierte Kategorie "Keine" verwendet.'
    }

    this.confirmationDialogService.openDialog(dialogData).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: result => {
          if (result) {
            this.save();
          }
        }
      }
    ));
  }

  save(): void {
    /*
    if (!this.formGroups) {
      return;
    }
    
    this.isSaving = true;

    const dtos = this.formGroups.map((group, index) => this.createCategoryUpdateDto(group, index));

    this.categoryContextService.updateCategories(dtos).subscribe(
      {
        next: _ => {
          this.isEditing = false;
          this.isSaving = false;
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Kategorien konnten nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
    */
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
