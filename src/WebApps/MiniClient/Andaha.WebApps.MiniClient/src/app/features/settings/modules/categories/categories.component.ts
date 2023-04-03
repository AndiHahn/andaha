import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from 'src/app/api/shopping/dtos/CategoryUpdateDto';
import { SubCategoryUpdateDto } from 'src/app/api/shopping/dtos/SubCategoryUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { CategoryForm, createCategoryFormGroup, SubCategoryForm } from './functions/form-functions';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories?: CategoryDto[];

  isSaving: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  formGroups?: FormGroup<CategoryForm>[];
  
  get allCategoriesValid(): boolean {
    let valid = true;

    this.formGroups?.forEach(group => {
      if (group.invalid)  {
        valid = false;
      }
    });

    return valid;
  }

  constructor(
    private snackbar: MatSnackBar,
    private confirmationDialogService: ConfirmationDialogService,
    private categoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onDeleteCategory(index: number): void {
    if (this.isEditing && this.formGroups) {
      this.formGroups.splice(index, 1);
    }
  }

  onEditClick(): void {
    this.isEditing = true;
  }

  onCancelClick(): void {
    this.initFormGroups(this.categories ?? []);
    this.isEditing = false;
  }

  onAddCategoryClick(): void {
    this.formGroups?.push(createCategoryFormGroup([], '', ''));
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
  }

  isDefaultCategory(index: number): boolean {
    if (!this.categories) {
      return false;
    }

    return this.categories[index]?.isDefault;
  }

  private initSubscriptions(): void {
    this.isLoading = true;
    
    this.categoryContextService.categories().subscribe(
      {
        next: categories => {
          if (categories) {
            this.categories = categories;
            this.initFormGroups(categories);
            this.isLoading = false;
          }
        },
        error: _ => this.isLoading = false
      }
    );
  }

  private initFormGroups(categories: CategoryDto[]): void {
    const formGroups: FormGroup<CategoryForm>[] = [];
    
    categories.forEach(category => {
      const formGroup = createCategoryFormGroup(category.subCategories, category.name, category.color, category.id);
      
      formGroups.push(formGroup);
    });

    this.formGroups = formGroups;
  }
  
  private createCategoryUpdateDto(formGroup: FormGroup<CategoryForm>, order: number): CategoryUpdateDto {
    const controls = formGroup.controls;

    return {
      id: controls.id.value ?? undefined,
      name: controls.name.value,
      color: controls.color.value,
      order: order,
      includeToStatistics: true,
      subCategories: this.createSubCategoryUpdateDtos(controls.subCategories)
    }
  }

  private createSubCategoryUpdateDtos(categories: FormArray<FormGroup<SubCategoryForm>>): SubCategoryUpdateDto[]  {
    const subCategories: SubCategoryUpdateDto[] = [];
    
    for (let index = 0; index < categories.length; index++) {
      const subCategoryForm = categories.at(index);

      subCategories.push(this.createSubCategoryUpdateDto(subCategoryForm, index));
    }

    return subCategories;
  }

  private createSubCategoryUpdateDto(subCategory: FormGroup<SubCategoryForm>, order: number): SubCategoryUpdateDto {
    
    return {
      id: subCategory.controls.id.value ?? undefined,
      name: subCategory.controls.name.value,
      order: order
    }
  }
}
