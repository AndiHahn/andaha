import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { CategoryDto } from "src/app/api/shopping/dtos/CategoryDto";

export interface SubCategoryForm {
  id: FormControl<string | null>;
  name: FormControl<string>;
}

export interface CategoryForm {
  id: FormControl<string | null>;
  name: FormControl<string>;
  color: FormControl<string>;
  order: FormControl<number>;
  isDefault: FormControl<boolean>;
  includeToStatistics: FormControl<boolean>;
  subCategories: FormArray<FormGroup<SubCategoryForm>>;
}

export function createEmptyForm(): FormGroup<CategoryForm> {
  return new FormGroup<CategoryForm>({
    id: new FormControl(null),
    name: new FormControl('', { nonNullable: true, validators: [ Validators.required ] }),
    color: new FormControl('', { nonNullable: true, validators: [ Validators.required ]}),
    order: new FormControl(0, { nonNullable: true }),
    isDefault: new FormControl(false, { nonNullable: true }),
    includeToStatistics: new FormControl(true, { nonNullable: true }),
    subCategories: new FormArray<FormGroup<SubCategoryForm>>([])
  });
}

export function createCategoryForm(category: CategoryDto): FormGroup<CategoryForm> {
  return new FormGroup<CategoryForm>({
    id: new FormControl(category.id),
    name: new FormControl(category.name, { nonNullable: true, validators: [ Validators.required ] }),
    color: new FormControl(category.color, { nonNullable: true, validators: [ Validators.required ]}),
    order: new FormControl(category.order, { nonNullable: true }),
    isDefault: new FormControl(category.isDefault, { nonNullable: true }),
    includeToStatistics: new FormControl(category.includeToStatistics, { nonNullable: true }),
    subCategories: new FormArray<FormGroup<SubCategoryForm>>(category.subCategories.map(category => createSubCategoryForm(category.name, category.id)))
  });
}

export function createSubCategoryForm(name: string, id?: string): FormGroup<SubCategoryForm> {
  return new FormGroup<SubCategoryForm>({
    id: new FormControl(id ?? null, { nonNullable: false }),
    name: new FormControl(name, { nonNullable: true, validators: [ Validators.required ]})
  })
}
