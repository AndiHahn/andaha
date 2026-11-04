import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { Duration, DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeUpdateDto } from 'src/app/api/budgetplan/dtos/IncomeUpdateDto';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { IncomeContextService } from '../../../services/income-context.service';
import { IncomeHistoryDialogService } from '../income-history-dialog/income-history-dialog.service';
import { IncomeHistoryDialogData } from '../income-history-dialog/IncomeHistoryDialogData';
import { IncomeForm } from '../functions/income-form-functions';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-income-details',
    templateUrl: './income-details.component.html',
    styleUrls: ['./income-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, MatProgressBar, FormsModule, ReactiveFormsModule, MatSelect, MatOption, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class IncomeDetailsComponent implements OnInit, OnDestroy {
  private historyTrail = inject(HistoryTrailService);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private incomeContextService = inject(IncomeContextService);
  private incomeHistoryDialogService = inject(IncomeHistoryDialogService);
  private pageTitleService = inject(PageTitleService);


  form!: FormGroup<IncomeForm>;

  income?: IncomeDto;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  durationOptions = Object.values(Duration);
  durationLabel = DurationLabel;

  ngOnInit(): void {
    const incomeId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!incomeId) {
      leaveDetailNotFound(this.historyTrail, this.snackbar, '/budgetplan/income');
      return;
    }

    this.incomeContextService.byId(incomeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: income => {
        if (!income) {
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/budgetplan/income');
          return;
        }

        this.income = income;
        this.form = this.getFormFromDto(income);
        this.form.disable();

        // Kopfzeile: Name als Titel, Verlauf als Icon-Button (Mockup 04, Fixkosten bearbeiten)
        this.pageTitleService.set(income.name);
        this.pageTitleService.setAction({ icon: 'history', label: 'Verlauf anzeigen', run: () => this.onShowHistoryClick() });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.pageTitleService.setAction(null);
  }

  onShowHistoryClick(): void {
    const data: IncomeHistoryDialogData = {
      incomeId: this.income!.id
    }

    this.incomeHistoryDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe());
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = this.getFormFromDto(this.income!);
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

    this.incomeContextService.updateIncome(this.income!.id, dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.income = { ...this.income!, ...dto };
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

    this.incomeContextService.deleteIncome(this.income!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          // zurück zur Liste; Zurück führt danach nicht auf den gelöschten Eintrag
          this.historyTrail.leaveTo('/budgetplan/income');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Einkommen konnte nicht gelöscht werden.", this.snackbar);
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
