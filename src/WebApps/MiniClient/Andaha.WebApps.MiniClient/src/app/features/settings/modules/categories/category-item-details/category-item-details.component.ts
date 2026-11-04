import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from 'src/app/api/shopping/dtos/CategoryUpdateDto';
import { SubCategoryUpdateDto } from 'src/app/api/shopping/dtos/SubCategoryUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { getAllColors } from '../functions/category-functions';
import { CategoryForm, createSubCategoryForm, createCategoryForm, SubCategoryForm } from '../functions/form-functions';
import { MatSelect, MatSelectTrigger, MatOption } from '@angular/material/select';
import { ColorItemComponent } from '../color-item/color-item.component';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-category-item-details',
    templateUrl: './category-item-details.component.html',
    styleUrls: ['./category-item-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, FormsModule, ReactiveFormsModule, MatSelect, MatSelectTrigger, ColorItemComponent, MatOption, MatIcon, MatCheckbox, CdkDropList, CdkDrag, CdkDragHandle, MatProgressBar, MatProgressSpinner, ShowErrorPipe]
})
export class CategoryItemDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private historyTrail = inject(HistoryTrailService);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private categoryContextService = inject(BillCategoryContextService);
  private pageTitleService = inject(PageTitleService);


  form!: FormGroup<CategoryForm>;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  category?: CategoryDto;
  includeToStatisticsCheckbox: boolean = false;

  colors: string[];
  selectedColor: string = '';

  private destroy$: Subject<void> = new Subject<void>();

  get subCategoryForms(): FormArray<FormGroup<SubCategoryForm>> {
    return this.form.controls.subCategories;
  }
  
  constructor() {
    this.colors = getAllColors();
  }

  ngOnInit(): void {
    const categoryId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!categoryId) {
      leaveDetailNotFound(this.historyTrail, this.snackbar, '/settings/categories');
      return;
    }

    this.categoryContextService.categoryById(categoryId).pipe(takeUntil(this.destroy$)).subscribe({
      next: category => {
        if (!category) {
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/settings/categories');
          return;
        }

        this.category = category;
        this.selectedColor = category.color;
        this.includeToStatisticsCheckbox = category.includeToStatistics;
        this.form = createCategoryForm(category);
        this.form.disable();

        // Kopfzeile: Kategoriename als Titel (Mockup 06, Kategorie bearbeiten)
        this.pageTitleService.set(category.name);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
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
    this.form = createCategoryForm(this.category!);
    this.form.disable();
    this.subCategoryForms.disable();
    this.includeToStatisticsCheckbox = this.category!.includeToStatistics;
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createModelFromForm();

    this.categoryContextService.updateCategory(this.category!.id, dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          const saved = this.categoryContextService.getCategoryById(this.category!.id);
          this.category = saved ?? {
            ...this.category!,
            name: dto.name,
            color: dto.color,
            includeToStatistics: dto.includeToStatistics,
            subCategories: this.subCategoryForms.controls.map((f, order) => ({
              id: f.controls.id.value ?? '',
              name: f.controls.name.value,
              order
            }))
          };
          this.selectedColor = this.category.color;
          this.includeToStatisticsCheckbox = this.category.includeToStatistics;
          this.form = createCategoryForm(this.category);
          this.form.disable();
          this.pageTitleService.set(dto.name);
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving = false;
          this.isEditing = true;
          this.form.enable();
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

    this.categoryContextService.deleteCategory(this.category!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          // zurück zur Liste; Zurück führt danach nicht auf den gelöschten Eintrag
          this.historyTrail.leaveTo('/settings/categories');
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
        id: subCategoryControls.id.value || undefined,
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
