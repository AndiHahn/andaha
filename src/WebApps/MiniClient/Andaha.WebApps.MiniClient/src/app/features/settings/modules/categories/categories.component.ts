import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillCategoryUpdateDto } from 'src/app/api/shopping/dtos/BillCategoryUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories?: BillCategoryDto[];

  isSaving: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  formGroups?: FormGroup[];
  
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
    this.formGroups?.push(this.createCategoryFormGroup('', ''));
  }

  onSaveClick(): void {
    const dialogData: ConfirmationDialogData = {
      text: 'Wurden Kategorien gelöscht, die bereits für Rechnungen verwendet wurden, dann wird für diese die vorkonfigurierte Kategorie "undefiniert" verwendet.'
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
    
    this.isEditing = false;

    const dtos = this.formGroups.map(group => this.createCategoryUpdateDto(group));

    this.categoryContextService.updateCategories(dtos);
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

  private initFormGroups(categories: BillCategoryDto[]): void {
    const formGroups: FormGroup[] = [];
    
    categories.forEach(category => {
      const formGroup = this.createCategoryFormGroup(category.name, category.color, category.id);
      
      formGroups.push(formGroup);
    });

    this.formGroups = formGroups;
  }

  private createCategoryFormGroup(name: string, color: string, id?: string): FormGroup {
    return new FormGroup({
      categoryId: new FormControl(id),
      categoryName: new FormControl(name, [ Validators.required ]),
      categoryColor: new FormControl(color, [ Validators.required ])
    });
  }

  private createCategoryUpdateDto(formGroup: FormGroup): BillCategoryUpdateDto {
    const controls = formGroup.controls;

    return {
      id: controls['categoryId'].value,
      name: controls['categoryName'].value,
      color: controls['categoryColor'].value
    }
  }
}
