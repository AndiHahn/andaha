import { Component, OnInit } from '@angular/core';
import { FormGroupDirective, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { generateGuid } from 'src/app/api/functions/api-utils';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/services/bill-context.service';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.scss']
})
export class AddBillComponent implements OnInit {
  numberRegex: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

  form: UntypedFormGroup;

  categories?: BillCategoryDto[];
  
  constructor(
    private fb: UntypedFormBuilder,
    private billContextService: BillContextService,
    private billCategoryContextService: BillCategoryContextService
    ) { 
    this.form = this.fb.group({
      shopName: ['', [Validators.required, Validators.maxLength(200)]],
      notes: ['', [Validators.maxLength(1000)]],
      category: ['', Validators.required],
      price: ['', [Validators.min(0), Validators.pattern(this.numberRegex)]],
      date: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadBillCategories();
  }

  private loadBillCategories() {
    this.billCategoryContextService.categories().subscribe({
      next: categories => {
        this.categories = categories;
      }
    })
  }

  onSubmit(formDirective: FormGroupDirective) {
    if (!this.form.valid) {
      return;
    }

    const dto = this.createModelFromForm();
    const category = this.getCategoryFromForm();

    this.billContextService.addBill(dto, category);
    
    formDirective.resetForm();
    this.form.reset();
    this.form.controls['date'].setValue(new Date());
  }

  private createModelFromForm(): BillCreateDto {
    const controls = this.form.controls;
    return {
      id: generateGuid(),
      categoryId: controls['category'].value.id,
      shopName: controls['shopName'].value,
      price: controls['price'].value,
      date: controls['date']?.value,
      notes: controls['notes']?.value
    }
  }

  private getCategoryFromForm(): BillCategoryDto {
    const controls = this.form.controls;
    return {
      id: controls['category'].value.id,
      name: controls['category'].value.name,
      color: controls['category'].value.color,
      isDefault: controls['category'].value.isDefault,
    }
  }
}
