import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillUpdateDto } from 'src/app/api/shopping/dtos/BillUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { BillForm, getBillForm } from '../../functions/bill-form-functions';
import { ImageSnippet } from '../add-bill-image-dialog/add-bill-image-dialog.component';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillSubCategoryDto } from 'src/app/api/shopping/dtos/BillSubCategoryDto';
import { MatSelectChange, MatSelect, MatSelectTrigger, MatOption } from '@angular/material/select';
import { BillImageComponent } from '../bill-image/bill-image.component';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker } from '@angular/material/datepicker';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ShowErrorPipe } from '../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-bill-details',
    templateUrl: './bill-details.component.html',
    styleUrls: ['./bill-details.component.scss'],
    providers: GERMAN_DATE_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [BillImageComponent, FormsModule, ReactiveFormsModule, MatSelect, MatSelectTrigger, MatOption, MatIcon, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker, MatProgressBar, MatProgressSpinner, DecimalPipe, DatePipe, ShowErrorPipe]
})
export class BillDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private billContextService = inject(BillContextService);
  private billCategoryContextService = inject(BillCategoryContextService);


  form!: FormGroup<BillForm>;

  allCategories?: CategoryDto[];

  bill?: BillDto;
  billCategories?: BillCategoryDto[];
  billSubCategories?: BillSubCategoryDto[];
  image?: ImageSnippet;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;
  isExternal: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    const billId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!billId) {
      leaveDetailNotFound(this.router, this.snackbar, '/bill/list');
      return;
    }

    this.billContextService.loadBillById(billId).pipe(takeUntil(this.destroy$)).subscribe({
      next: bill => {
        if (!bill) {
          leaveDetailNotFound(this.router, this.snackbar, '/bill/list');
          return;
        }

        this.bill = bill;
        this.form = getBillForm(bill);
        this.form.disable();
        this.initSubscriptions();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  categorySelectionChanged(selection: MatSelectChange): void {
    const category = this.allCategories?.find(c => c.id == selection.value.id);
    this.billSubCategories = category?.subCategories;

    this.form.controls.subCategory.setValue(null);
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = getBillForm(this.bill!);
    this.updateCategory();
    this.form.disable();
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createModelFromForm();
    const category = this.getCategoryFromForm();
    const subCategory = this.getSubCategoryFromForm();

    this.billContextService.updateBill(this.bill!.id, dto, this.bill!.imageAvailable, category, subCategory).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          // Rechnung kann ausserhalb der geladenen Liste liegen (GET bill/{id}); dann den Stand hier nachziehen.
          Object.assign(this.bill!, {
            shopName: dto.shopName,
            notes: dto.notes,
            price: dto.price,
            date: dto.date,
            category,
            subCategory,
            imageAvailable: dto.image != undefined || this.bill!.imageAvailable
          });
        },
        error: _ => {
          this.isSaving = false;
          this.isEditing = true;
          this.form.enable();
          openErrorSnackbar("Rechnung konnte nicht gespeichert werden.", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll die Rechnung und alle damit verbundenen Daten wirklich gelöscht werden?'
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

  onImageSelected(image: ImageSnippet): void {
    this.image = image;
  }

  private delete(): void {
    this.isDeleting = true;

    this.billContextService.deleteBill(this.bill!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.router.navigateByUrl('/bill/list');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Rechnung konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private updateCategory(): void {
    const bill = this.bill;
    if (!bill) {
      return;
    }

    this.updateCategories();

    const category = this.billCategories?.find(category => category.id == bill.category.id);
    if (category) {
      this.form.controls.category.setValue(category);

      const categoryWithSubCategories = this.allCategories?.find(c => c.id == category.id);
      this.billSubCategories = categoryWithSubCategories?.subCategories;

      const subCategory = this.billSubCategories?.find(c => c.id == bill.subCategory?.id);
      if (subCategory) {
        this.form.controls.subCategory.setValue(subCategory);
      }
    }
  }

  private updateCategories(): void {
    const bill = this.bill;
    if (!this.billCategories || !bill) {
      return;
    }
    
    const containsCategory = this.billCategories.some(category => category.id == bill.category.id);
    if (!containsCategory) {
      const categoryWithSameName = this.billCategories.find(category => category.name == bill.category.name);
      if (categoryWithSameName) {
        categoryWithSameName.id = bill.category.id;
        categoryWithSameName.color = bill.category.color;
      } else {
        this.billCategories.push({
          id: bill.category.id,
          name: bill.category.name,
          color: bill.category.color,
          order: bill.category.order
        });
      }
    }
  }

  private initSubscriptions(): void {
    this.billCategoryContextService.categories().pipe(takeUntil(this.destroy$)).subscribe({
      next: categories => {
        this.allCategories = categories;
        this.billCategories = categories.map(c => this.categoryToBillCategory(c));
        this.updateCategory();
      }
    });

    this.billContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.isLoading = loading
      }
    );
  }

  private createModelFromForm(): BillUpdateDto {
    const controls = this.form.controls;
    return {
      categoryId: controls.category.value!.id,
      subCategoryId: controls.subCategory?.value?.id,
      shopName: controls.shopName.value,
      price: controls.price.value!,
      date: new Date(controls.date.value),
      notes: controls.notes?.value ?? undefined,
      image: this.image?.file ?? undefined
    }
  }

  private getCategoryFromForm(): BillCategoryDto {
    const controls = this.form.controls;
    return {
      id: controls.category.value!.id,
      name: controls.category.value!.name,
      color: controls.category.value!.color,
      order: controls.category.value!.order
    }
  }

  private getSubCategoryFromForm(): BillSubCategoryDto | undefined {
    const controls = this.form.controls;

    if (!controls.subCategory.value) {
      return undefined;
    }

    return {
      id: controls.subCategory.value.id,
      name: controls.subCategory.value.name,
      order: controls.subCategory.value.order
    }
  }

  private categoryToBillCategory(category: CategoryDto): BillCategoryDto {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      order: category.order
    }
  }
}
