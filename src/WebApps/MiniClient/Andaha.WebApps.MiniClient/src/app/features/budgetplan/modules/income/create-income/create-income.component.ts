import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { vibrate } from 'src/app/shared/utils/haptics';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeCreateDto } from 'src/app/api/budgetplan/dtos/IncomeCreateDto';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { IncomeContextService } from '../../../services/income-context.service';
import { IncomeForm, getEmptyForm } from '../functions/income-form-functions';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-create-income',
    templateUrl: './create-income.component.html',
    styleUrls: ['./create-income.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, FormsModule, ReactiveFormsModule, MatSelect, MatOption, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class CreateIncomeComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private incomeContextService = inject(IncomeContextService);
  private historyTrail = inject(HistoryTrailService);


  form: FormGroup<IncomeForm>;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;

  isSaving: boolean = false;
  
  constructor() {
    this.form = getEmptyForm();
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.incomeContextService.createIncome(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          openSuccessSnackbar(`Gespeichert · ${dto.name}`, this.snackbar);
          vibrate();
          this.historyTrail.leaveTo('/budgetplan/income');
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Eintrag konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
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
