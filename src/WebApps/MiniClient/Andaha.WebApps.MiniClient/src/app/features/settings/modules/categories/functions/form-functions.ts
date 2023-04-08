import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { SubCategoryDto } from "src/app/api/shopping/dtos/SubCategoryDto";

export interface SubCategoryForm {
  id: FormControl<string | null>;
  name: FormControl<string>;
}

export interface CategoryForm {
  id: FormControl<string | null>;
  name: FormControl<string>;
  color: FormControl<string>;
  isDefault: FormControl<boolean>;
  subCategories: FormArray<FormGroup<SubCategoryForm>>;
}

export interface SubCategoryItem {
  id?: string;
  name: string;
}

export function createCategoryFormGroup(subCategories: SubCategoryDto[], name: string, color: string, isDefault: boolean, id?: string): FormGroup<CategoryForm> {
  return new FormGroup<CategoryForm>({
    id: new FormControl(id ?? null),
    name: new FormControl(name, { nonNullable: true, validators: [ Validators.required ] }),
    color: new FormControl(color, { nonNullable: true, validators: [ Validators.required ]}),
    isDefault: new FormControl(isDefault, { nonNullable: true }),
    subCategories: new FormArray<FormGroup<SubCategoryForm>>(subCategories.map(category => createSubCategoryForm(category.name, category.id)))
  });
}

export function createSubCategoryForm(name: string, id?: string): FormGroup<SubCategoryForm> {
  return new FormGroup<SubCategoryForm>({
    id: new FormControl(id ?? null, { nonNullable: false }),
    name: new FormControl(name, { nonNullable: true, validators: [ Validators.required ]})
  })
}
