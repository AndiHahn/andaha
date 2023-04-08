import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
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
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { BillForm, getBillForm } from '../../functions/bill-form-functions';
import { ImageSnippet } from '../add-bill-image-dialog/add-bill-image-dialog.component';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillSubCategoryDto } from 'src/app/api/shopping/dtos/BillSubCategoryDto';
import { MatSelectChange } from '@angular/material/select';

export const MY_FORMATS = {
  parse: {
    dateInput: 'L',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-bill-details',
  templateUrl: './bill-details.component.html',
  styleUrls: ['./bill-details.component.scss'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class BillDetailsComponent implements OnInit, OnDestroy {

  form: FormGroup<BillForm>;

  allCategories?: CategoryDto[];

  bill: BillDto;
  billCategories?: BillCategoryDto[];
  billSubCategories?: BillSubCategoryDto[];
  image?: ImageSnippet;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;
  isExternal: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
    private billContextService: BillContextService,
    private billCategoryContextService: BillCategoryContextService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    const billId = params["id"];
    if (!billId) {
      throw new Error("No billId available.");
    }

    const bill = this.billContextService.getBillById(billId);
    if (!bill) {
      throw new Error("Bill with id: " + billId + " is not available.");
    }

    this.bill = bill;
    this.form = getBillForm(bill);
    this.form.disable();
  }

  ngOnInit(): void {
    this.initSubscriptions();
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
    this.form = getBillForm(this.bill);
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

    this.billContextService.updateBill(this.bill.id, dto, this.bill.imageAvailable, category, subCategory).subscribe(
      {
        next: _ => this.isSaving = false,
        error: _ => {
          this.isSaving = false;
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

    this.billContextService.deleteBill(this.bill.id).subscribe(
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
    this.updateCategories();

    const category = this.billCategories?.find(category => category.id == this.bill.category.id);
    if (category) {
      this.form.controls.category.setValue(category);

      const categoryWithSubCategories = this.allCategories?.find(c => c.id == category.id);
      this.billSubCategories = categoryWithSubCategories?.subCategories;

      const subCategory = this.billSubCategories?.find(c => c.id == this.bill.subCategory?.id);
      if (subCategory) {
        this.form.controls.subCategory.setValue(subCategory);
      }
    }
  }

  private updateCategories(): void {
    if (!this.billCategories || !this.bill) {
      return;
    }
    
    const containsCategory = this.billCategories.some(category => category.id == this.bill.category.id);
    if (!containsCategory) {
      const categoryWithSameName = this.billCategories.find(category => category.name == this.bill.category.name);
      if (categoryWithSameName) {
        categoryWithSameName.id = this.bill.category.id;
        categoryWithSameName.color = this.bill.category.color;
      } else {
        this.billCategories.push({
          id: this.bill.category.id,
          name: this.bill.category.name,
          color: this.bill.category.color,
          order: this.bill.category.order
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
