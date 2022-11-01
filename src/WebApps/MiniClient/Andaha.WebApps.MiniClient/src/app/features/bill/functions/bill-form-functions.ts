import { FormControl, FormGroup, Validators } from "@angular/forms"
import { BillCategoryDto } from "src/app/api/shopping/dtos/BillCategoryDto";
import { BillDto } from "src/app/api/shopping/dtos/BillDto";

const NUMBER_REGEX: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

export interface BillForm {
  shopName: FormControl<string>;
  notes: FormControl<string | null>;
  category: FormControl<BillCategoryDto | null>;
  price: FormControl<number | null>;
  date: FormControl<Date>;
}

export function getEmptyBillForm(): FormGroup<BillForm> {
  return getBillFormGroup('', '', null, null, new Date());
}

export function getBillForm(bill: BillDto): FormGroup<BillForm> {
  return getBillFormGroup(bill.shopName, bill.notes ?? null, bill.category, bill.price, bill.date);
}

export function getBillFormGroup(
  shopName: string,
  notes: string | null,
  category: BillCategoryDto | null,
  price: number | null,
  date: Date
): FormGroup<BillForm> {
  return new FormGroup<BillForm>(
    {
      shopName: new FormControl(shopName, { nonNullable: true, validators: [ Validators.required, Validators.maxLength(200) ]}),
      notes: new FormControl(notes, { validators: [ Validators.maxLength(1000) ]}),
      category: new FormControl(category, { validators: [ Validators.required ]}),
      price: new FormControl(price, { nonNullable: false, validators: [ Validators.min(0), Validators.pattern(NUMBER_REGEX) ]}),
      date: new FormControl(date, { nonNullable: true })
    }
  );
}