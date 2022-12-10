import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeUpdateDto } from 'src/app/api/budgetplan/dtos/IncomeUpdateDto';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { IncomeContextService } from '../../../services/income-context.service';
import { IncomeHistoryDialogService } from '../income-history-dialog/income-history-dialog.service';
import { IncomeHistoryDialogData } from '../income-history-dialog/IncomeHistoryDialogData';
import { IncomeForm } from '../functions/income-form-functions';

@Component({
  selector: 'app-income-details',
  templateUrl: './income-details.component.html',
  styleUrls: ['./income-details.component.scss']
})
export class IncomeDetailsComponent implements OnInit {

  form: FormGroup<IncomeForm>;

  income: IncomeDto;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
    private incomeContextService: IncomeContextService,
    private incomeHistoryDialogService: IncomeHistoryDialogService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    const incomeId = params["id"];
    if (!incomeId) {
      throw new Error("No incomeId available.");
    }

    const income = this.incomeContextService.getById(incomeId);
    if (!income) {
      throw new Error("Income with id: " + incomeId + " is not available.");
    }

    this.income = income;
    this.form = this.getFormFromDto(income);
    this.form.disable();
  }

  ngOnInit(): void {
  }

  onShowHistoryClick(): void {
    const data: IncomeHistoryDialogData = {
      incomeId: this.income.id
    }

    this.incomeHistoryDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe());
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = this.getFormFromDto(this.income);
    this.form.disable();
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.incomeContextService.updateIncome(this.income.id, dto).subscribe(
      {
        next: _ => this.isSaving = false,
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar("Eintrag konnte nicht gespeichert werden.", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll der Fixkostenpunkt wirklich gelöscht werden?'
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

    this.incomeContextService.deleteIncome(this.income.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.router.navigateByUrl('/budgetplan/income');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Fixkostenpunkt konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private createDtoFromForm(): IncomeUpdateDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      duration: controls.duration.value,
      value: controls.value.value!
    }
  }

  private getFormFromDto(dto: IncomeDto): FormGroup<IncomeForm> {
    return new FormGroup<IncomeForm>(
      {
        name: new FormControl(dto.name, { nonNullable: true, validators: [ Validators.required ]}),
        duration: new FormControl(dto.duration, { nonNullable: true, validators: [ Validators.required ]}),
        value: new FormControl(dto.value, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]})
      }
    );
  }
}
