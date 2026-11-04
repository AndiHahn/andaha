import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms"
import { BillDto } from "src/app/api/shopping/dtos/BillDto";
import { BillSubCategoryDto } from "src/app/api/shopping/dtos/BillSubCategoryDto";
import { BillCategoryDto } from "src/app/api/shopping/dtos/BillCategoryDto";
import { parseAmount } from "../quick-entry/logic/amount-input";

const NUMBER_REGEX: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

export interface BillForm {
  shopName: FormControl<string>;
  notes: FormControl<string | null>;
  category: FormControl<BillCategoryDto | null>;
  subCategory: FormControl<BillSubCategoryDto | null>;
  price: FormControl<number | null>;
  date: FormControl<Date>;
}

export function getBillForm(bill: BillDto): FormGroup<BillForm> {
  return getBillFormGroup(bill.shopName, bill.notes ?? null, bill.category, bill.subCategory ?? null, bill.price, bill.date);
}

export function getBillFormGroup(
  shopName: string,
  notes: string | null,
  categoryId: BillCategoryDto | null,
  subCategory: BillSubCategoryDto | null,
  price: number | null,
  date: Date
): FormGroup<BillForm> {
  return new FormGroup<BillForm>(
    {
      shopName: new FormControl(shopName, { nonNullable: true, validators: [ Validators.required, Validators.maxLength(200) ]}),
      notes: new FormControl(notes, { validators: [ Validators.maxLength(1000) ]}),
      category: new FormControl(categoryId, { validators: [ Validators.required ]}),
      subCategory: new FormControl(subCategory, { nonNullable: false }),
      price: new FormControl(price, { nonNullable: false, validators: [ Validators.min(0), Validators.pattern(NUMBER_REGEX) ]}),
      date: new FormControl(date, { nonNullable: true })
    }
  );
}
/** Großes Formular `/bill/create`: Preis als Text mit Komma (AC24), geprüft wie die Schnellerfassung */
export interface CreateBillForm {
  price: FormControl<string>;
  shopName: FormControl<string>;
  category: FormControl<BillCategoryDto | null>;
  subCategory: FormControl<BillSubCategoryDto | null>;
  date: FormControl<Date>;
  notes: FormControl<string>;
}

/** Betrag > 0 mit Komma oder Punkt, höchstens 2 Nachkommastellen (`parseAmount`) */
export function amountValidator(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value ?? '';
  if (value.trim() === '') {
    return null; // „required“ meldet das
  }
  return parseAmount(value) === null ? { amount: true } : null;
}

export function getCreateBillForm(): FormGroup<CreateBillForm> {
  return new FormGroup<CreateBillForm>({
    price: new FormControl('', { nonNullable: true, validators: [ Validators.required, amountValidator ]}),
    shopName: new FormControl('', { nonNullable: true, validators: [ Validators.required, Validators.pattern(/\S/), Validators.maxLength(200) ]}),
    category: new FormControl<BillCategoryDto | null>(null, { validators: [ Validators.required ]}),
    subCategory: new FormControl<BillSubCategoryDto | null>(null),
    date: new FormControl(new Date(), { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true, validators: [ Validators.maxLength(1000) ]})
  });
}
