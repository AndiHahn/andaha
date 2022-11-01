import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillUpdateDto } from 'src/app/api/shopping/dtos/BillUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/services/bill-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { BillForm, getBillForm } from '../../functions/bill-form-functions';

@Component({
  selector: 'app-bill-details',
  templateUrl: './bill-details.component.html',
  styleUrls: ['./bill-details.component.scss']
})
export class BillDetailsComponent implements OnInit, OnDestroy {

  form: FormGroup<BillForm>;

  bill: BillDto;
  categories?: BillCategoryDto[];
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isReadOnly: boolean = true;
  isLoading: boolean = false;

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

    if (!bill.isExternal) {
      this.isReadOnly = false;
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

    this.billContextService.updateBill(this.bill.id, dto, category).subscribe(
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
    const category = this.categories?.find(category => category.id == this.bill.category.id);
    if (category) {
      this.form.controls.category.setValue(category);
    }
  }

  private initSubscriptions(): void {
    this.billCategoryContextService.categories().pipe(takeUntil(this.destroy$)).subscribe({
      next: categories => {
        this.categories = categories;
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
      date: controls.date.value,
      notes: controls.notes?.value ?? undefined
    }
  }

  private getCategoryFromForm(): BillCategoryDto {
    const controls = this.form.controls;
    return {
      id: controls.category.value!.id,
      name: controls.category.value!.name,
      color: controls.category.value!.color,
      isDefault: controls.category.value!.isDefault,
    }
  }
}
