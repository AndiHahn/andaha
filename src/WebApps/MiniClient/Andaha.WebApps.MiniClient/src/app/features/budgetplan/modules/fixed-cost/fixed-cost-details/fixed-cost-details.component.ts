import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { CostCategory, CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostUpdateDto } from 'src/app/api/budgetplan/dtos/FixedCostUpdateDto';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { FixedCostContextService } from '../../../services/fixed-cost-context.service';
import { FixedCostHistoryDialogService } from '../fixed-cost-history-dialog/fixed-cost-history-dialog.service';
import { FixedCostHistoryDialogData } from '../fixed-cost-history-dialog/FixedCostHistoryDialogData';
import { FixedCostForm } from '../functions/fixed-cost-form-functions';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-fixed-cost-details',
    templateUrl: './fixed-cost-details.component.html',
    styleUrls: ['./fixed-cost-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, MatProgressBar, FormsModule, ReactiveFormsModule, MatSelect, MatOption, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class FixedCostDetailsComponent implements OnInit, OnDestroy {
  private historyTrail = inject(HistoryTrailService);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private fixedCostContextService = inject(FixedCostContextService);
  private fixedCostHistoryDialogService = inject(FixedCostHistoryDialogService);
  private pageTitleService = inject(PageTitleService);


  form!: FormGroup<FixedCostForm>;

  fixedCost?: FixedCostDto;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  costCategoryOptions = Object.values(CostCategory);
  costCategoryLabel = CostCategoryLabel;

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;

  ngOnInit(): void {
    const fixedCostId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!fixedCostId) {
      leaveDetailNotFound(this.historyTrail, this.snackbar, '/budgetplan/fixedcost');
      return;
    }

    this.fixedCostContextService.byId(fixedCostId).pipe(takeUntil(this.destroy$)).subscribe({
      next: fixedCost => {
        if (!fixedCost) {
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/budgetplan/fixedcost');
          return;
        }

        this.fixedCost = fixedCost;
        this.form = this.getFormFromDto(fixedCost);
        this.form.disable();

        // Kopfzeile: Name als Titel, Verlauf als Icon-Button (Mockup 04, Fixkosten bearbeiten)
        this.pageTitleService.set(fixedCost.name);
        this.pageTitleService.setAction({ icon: 'history', label: 'Verlauf anzeigen', run: () => this.onShowHistoryClick() });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.pageTitleService.setAction(null);
  }

  onShowHistoryClick(): void {
    const data: FixedCostHistoryDialogData = {
      fixedCostId: this.fixedCost!.id
    }

    this.fixedCostHistoryDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe());
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = this.getFormFromDto(this.fixedCost!);
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

    this.fixedCostContextService.updateFixedCost(this.fixedCost!.id, dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.fixedCost = { ...this.fixedCost!, ...dto };
          this.pageTitleService.set(dto.name);
        },
        error: _ => {
          this.isSaving = false;
          this.isEditing = true;
          this.form.enable();
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

    this.fixedCostContextService.deleteFixedCost(this.fixedCost!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          vibrate();
          // zurück zur Liste; Zurück führt danach nicht auf den gelöschten Eintrag
          this.historyTrail.leaveTo('/budgetplan/fixedcost');
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
