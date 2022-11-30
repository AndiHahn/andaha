import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CostCategory, CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostCreateDto } from 'src/app/api/budgetplan/dtos/FixedCostCreateDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { FixedCostContextService } from '../../../services/fixed-cost-context.service';
import { FixedCostForm, getEmptyForm } from '../functions/fixed-cost-form-functions';

@Component({
  selector: 'app-create-fixed-cost',
  templateUrl: './create-fixed-cost.component.html',
  styleUrls: ['./create-fixed-cost.component.scss']
})
export class CreateFixedCostComponent implements OnInit {

  form: FormGroup<FixedCostForm>;

  costCategoryOptions = Object.values(CostCategory);
  costCategoryLabel = CostCategoryLabel;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;

  isSaving: boolean = false;
  
  constructor(
    private snackbar: MatSnackBar,
    private fixedCostContextService: FixedCostContextService
  ) {
    this.form = getEmptyForm();
  }

  ngOnInit(): void {
  }

  onSubmit(formDirective: FormGroupDirective): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.fixedCostContextService.createFixedCost(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.resetForm(formDirective);
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Eintrag konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
  }

  private resetForm(formDirective: FormGroupDirective): void {
    formDirective.resetForm();
    this.form.reset();
  }

  private createDtoFromForm(): FixedCostCreateDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      category: controls.category.value,
      duration: controls.duration.value,
      value: controls.value.value!
    }
  }
}
