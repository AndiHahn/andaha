import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CategoryForm, createEmptyForm } from '../functions/form-functions';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { getAllColors } from '../functions/category-functions';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryCreateDto } from 'src/app/api/shopping/dtos/CategoryCreateDto';

@Component({
  selector: 'app-create-category',
  templateUrl: './create-category.component.html',
  styleUrls: ['./create-category.component.scss']
})
export class CreateCategoryComponent implements OnInit {
  
  form: FormGroup<CategoryForm>;
  
  isSaving: boolean = false;

  includeToStatisticsCheckbox: boolean;

  colors: string[];
  selectedColor: string = '';
  
  constructor(
    private router: Router,
    private snackbar: MatSnackBar,
    private categoryContextService: BillCategoryContextService
  ) {
    this.form = createEmptyForm();
    this.includeToStatisticsCheckbox = true;
    this.colors = getAllColors();
  }

  ngOnInit(): void {
  }

  updateIncludeToStatistics(): void {
    this.includeToStatisticsCheckbox = !this.includeToStatisticsCheckbox;
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isSaving = true;

    const dto = this.createModelFromForm();

    this.categoryContextService.createCategory(dto).subscribe(
      {
        next: createdCategory => {
          this.isSaving = false;
          this.router.navigateByUrl('/settings/categories/' + createdCategory.id);
        },
        error: (err: HttpErrorResponse) => {
          openErrorSnackbar("Kategorie konnte nicht erstellt werden. (" + err.error + ")", this.snackbar);
        } 
      }
    );
  }

  private createModelFromForm(): CategoryCreateDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      color: controls.color.value,
      includeToStatistics: this.includeToStatisticsCheckbox,
      subCategories: []
    }
  }
}
