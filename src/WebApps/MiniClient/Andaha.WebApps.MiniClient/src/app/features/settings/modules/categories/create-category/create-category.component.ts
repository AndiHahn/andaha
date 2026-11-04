import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategoryForm, createEmptyForm } from '../functions/form-functions';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { getAllColors } from '../functions/category-functions';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryCreateDto } from 'src/app/api/shopping/dtos/CategoryCreateDto';
import { MatSelect, MatSelectTrigger, MatOption } from '@angular/material/select';
import { ColorItemComponent } from '../color-item/color-item.component';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-create-category',
    templateUrl: './create-category.component.html',
    styleUrls: ['./create-category.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, FormsModule, ReactiveFormsModule, MatSelect, MatSelectTrigger, ColorItemComponent, MatOption, MatIcon, MatCheckbox, MatProgressSpinner, ShowErrorPipe]
})
export class CreateCategoryComponent implements OnInit {
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private categoryContextService = inject(BillCategoryContextService);

  
  form: FormGroup<CategoryForm>;
  
  isSaving: boolean = false;

  includeToStatisticsCheckbox: boolean;

  colors: string[];
  
  constructor() {
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
          this.isSaving = false;
          this.form.enable();
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
