import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeCreateDto } from 'src/app/api/budgetplan/dtos/IncomeCreateDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { IncomeContextService } from '../../../services/income-context.service';
import { IncomeForm, getEmptyForm } from '../functions/income-form-functions';

@Component({
  selector: 'app-create-income',
  templateUrl: './create-income.component.html',
  styleUrls: ['./create-income.component.scss']
})
export class CreateIncomeComponent implements OnInit {

  form: FormGroup<IncomeForm>;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;

  isSaving: boolean = false;
  
  constructor(
    private snackbar: MatSnackBar,
    private incomeContextService: IncomeContextService
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

    this.incomeContextService.createIncome(dto).subscribe(
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

  private createDtoFromForm(): IncomeCreateDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      duration: controls.duration.value,
      value: controls.value.value!
    }
  }
}
