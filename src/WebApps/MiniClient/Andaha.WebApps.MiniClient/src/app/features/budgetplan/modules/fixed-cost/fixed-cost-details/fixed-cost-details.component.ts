import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CostCategory, CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostUpdateDto } from 'src/app/api/budgetplan/dtos/FixedCostUpdateDto';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { FixedCostContextService } from '../../../services/fixed-cost-context.service';
import { FixedCostHistoryDialogService } from '../fixed-cost-history-dialog/fixed-cost-history-dialog.service';
import { FixedCostHistoryDialogData } from '../fixed-cost-history-dialog/FixedCostHistoryDialogData';
import { FixedCostForm } from '../functions/fixed-cost-form-functions';

@Component({
  selector: 'app-fixed-cost-details',
  templateUrl: './fixed-cost-details.component.html',
  styleUrls: ['./fixed-cost-details.component.scss']
})
export class FixedCostDetailsComponent implements OnInit {

  form: FormGroup<FixedCostForm>;

  fixedCost: FixedCostDto;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  costCategoryOptions = Object.values(CostCategory);
  costCategoryLabel = CostCategoryLabel;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService,
    private fixedCostContextService: FixedCostContextService,
    private fixedCostHistoryDialogService: FixedCostHistoryDialogService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    const fixedCostId = params["id"];
    if (!fixedCostId) {
      throw new Error("No fixedCostId available.");
    }

    const fixedCost = this.fixedCostContextService.getById(fixedCostId);
    if (!fixedCost) {
      throw new Error("FixedCost with id: " + fixedCostId + " is not available.");
    }

    this.fixedCost = fixedCost;
    this.form = this.getFormFromDto(fixedCost);
    this.form.disable();
  }

  ngOnInit(): void {
  }

  onShowHistoryClick(): void {
    const data: FixedCostHistoryDialogData = {
      fixedCostId: this.fixedCost.id
    }

    this.fixedCostHistoryDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe());
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = this.getFormFromDto(this.fixedCost);
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

    this.fixedCostContextService.updateFixedCost(this.fixedCost.id, dto).subscribe(
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

    this.fixedCostContextService.deleteFixedCost(this.fixedCost.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.router.navigateByUrl('/budgetplan/fixedcost');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Fixkostenpunkt konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private createDtoFromForm(): FixedCostUpdateDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      category: controls.category.value,
      duration: controls.duration.value,
      value: controls.value.value!
    }
  }

  private getFormFromDto(dto: FixedCostDto): FormGroup<FixedCostForm> {
    return new FormGroup<FixedCostForm>(
      {
        name: new FormControl(dto.name, { nonNullable: true, validators: [ Validators.required ]}),
        category: new FormControl(dto.category, { nonNullable: true, validators: [ Validators.required ]}),
        duration: new FormControl(dto.duration, { nonNullable: true, validators: [ Validators.required ]}),
        value: new FormControl(dto.value, { nonNullable: true, validators: [ Validators.required, Validators.min(0) ]})
      }
    );
  }
}
