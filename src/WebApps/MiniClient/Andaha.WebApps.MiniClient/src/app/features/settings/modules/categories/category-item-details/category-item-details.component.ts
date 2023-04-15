import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from 'src/app/api/shopping/dtos/CategoryUpdateDto';
import { SubCategoryUpdateDto } from 'src/app/api/shopping/dtos/SubCategoryUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { getAllColors } from '../functions/category-functions';
import { CategoryForm, createSubCategoryForm, createCategoryForm, SubCategoryForm } from '../functions/form-functions';

@Component({
  selector: 'app-category-item-details',
  templateUrl: './category-item-details.component.html',
  styleUrls: ['./category-item-details.component.scss']
})
export class CategoryItemDetailsComponent implements OnInit {

  form: FormGroup<CategoryForm>;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  categoryId: string;
  category: CategoryDto;
  includeToStatisticsCheckbox: boolean;

  colors: string[];
  selectedColor: string = '';

  get subCategoryForms(): FormArray<FormGroup<SubCategoryForm>> {
    return this.form.controls.subCategories;
  }
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
    private categoryContextService: BillCategoryContextService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    this.categoryId = params["id"];
    if (!this.categoryId) {
      throw new Error("No categoryId available.");
    }

    const category = this.categoryContextService.getCategoryById(this.categoryId);
    if (!category) {
      throw new Error("Category with id: " + this.categoryId + " is not available.");
    }

    this.category = category;
    this.selectedColor = category.color;
    this.includeToStatisticsCheckbox = category.includeToStatistics;
    this.form = createCategoryForm(category);
    this.form.disable();

    this.colors = getAllColors();
  }

  ngOnInit(): void {
  }

  onDeleteSubCategoryClick(index: number): void {
    if (!this.isEditing) {
      return;
    }

    this.subCategoryForms.removeAt(index);
  }

  onAddSubCategoryClick(): void {
    this.subCategoryForms.push(createSubCategoryForm(''));
  }

  drop(event: CdkDragDrop<string[]>) {
    if (!this.subCategoryForms) {
      return;
    }
    
    const movedItem = this.subCategoryForms.at(event.previousIndex);
    this.subCategoryForms.removeAt(event.previousIndex);
    this.subCategoryForms.insert(event.currentIndex, movedItem);
  }

  updateIncludeToStatistics(): void {
    this.includeToStatisticsCheckbox = !this.includeToStatisticsCheckbox;
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
    this.subCategoryForms.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = createCategoryForm(this.category);
    this.form.disable();
    this.subCategoryForms.disable();
    this.includeToStatisticsCheckbox = this.category.includeToStatistics;
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createModelFromForm();

    this.categoryContextService.updateCategory(this.categoryId, dto).subscribe(
      {
        next: _ => this.isSaving = false,
        error: (err: HttpErrorResponse) => {
          openErrorSnackbar("Kategorie konnte nicht gespeichert werden. (" + err.error + ")", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll die Kategorie wirklich gelöscht werden? Wurde diese Kategorie bereits für Rechnungen verwendet, dann wird für diese Rechnungen die vorkonfigurierte Kategorie "Keine" verwendet.'
    }

    this.confirmationDialog.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: confirmed => {
          if (confirmed) {
            this.delete();
          }
        }
      }
    ));
  }

  private delete(): void {
    this.isDeleting = true;

    this.categoryContextService.deleteCategory(this.category.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.router.navigateByUrl('/settings/categories');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Kategorie konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private createModelFromForm(): CategoryUpdateDto {
    const controls = this.form.controls;

    const subCategories: SubCategoryUpdateDto[] = [];

    for(let index = 0; index < this.subCategoryForms.length; index++){
      const subCategoryControls = this.subCategoryForms.at(index).controls;

      subCategories.push({
        id: subCategoryControls.id.value ?? undefined,
        name: subCategoryControls.name.value,
        order: index
      })
    }

    return {
      name: controls.name.value,
      color: controls.color.value,
      includeToStatistics: this.includeToStatisticsCheckbox,
      subCategories: subCategories
    }
  }
}
