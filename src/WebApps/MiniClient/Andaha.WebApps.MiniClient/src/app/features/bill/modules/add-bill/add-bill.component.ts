import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { generateGuid } from 'src/app/api/functions/api-utils';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillCreateDto } from 'src/app/api/shopping/dtos/BillCreateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/services/bill-context.service';
import { BillForm, getEmptyBillForm } from '../../functions/bill-form-functions';
import { ImageSnippet } from '../add-bill-image-dialog/add-bill-image-dialog.component';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.scss'],
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
export class AddBillComponent implements OnInit {
  numberRegex: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

  form: FormGroup<BillForm>;

  categories?: BillCategoryDto[];

  image?: ImageSnippet;
  
  constructor(
    private billContextService: BillContextService,
    private billCategoryContextService: BillCategoryContextService
    ) {
    this.form = getEmptyBillForm();
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

  onImageSelected(image: ImageSnippet): void {
    this.image = image;
  }

  private createModelFromForm(): BillCreateDto {
    const controls = this.form.controls;
    return {
      id: generateGuid(),
      categoryId: controls.category.value!.id,
      shopName: controls.shopName.value,
      price: controls.price.value!,
      date: new Date(controls.date?.value),
      notes: controls.notes?.value ?? '',
      image: this.image?.file ?? undefined
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
