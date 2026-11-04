import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { PersonContextService } from '../../../services/person-context.service';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonForm, getPersonForm } from '../../../functions/person-form-functions';
import { UpdatePersonDto } from 'src/app/api/work/dtos/PersonUpdateDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { Subject, takeUntil } from 'rxjs';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { Time, DecimalPipe, DatePipe } from '@angular/common';
import { calculateTimeDifference, createTimeDisplayName } from '../../../functions/date-time-functions';
import { PersonPaymentDialogService } from '../person-payment-dialog/person-payment-dialog.service';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { WorkEntryListComponent } from '../work-entry-list/work-entry-list.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-person-details',
    templateUrl: './person-details.component.html',
    styleUrls: ['./person-details.component.scss'],
    providers: [WorkingEntriesContextService],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, MatProgressSpinner, WorkEntryListComponent, MatProgressBar, MatIcon, DecimalPipe, DatePipe, ShowErrorPipe]
})
export class PersonDetailsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(MatSnackBar);
  private contextService = inject(PersonContextService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private personPaymentDialogService = inject(PersonPaymentDialogService);
  private workingEntryContextService = inject(WorkingEntriesContextService);
  private pageTitleService = inject(PageTitleService);


  form!: FormGroup<PersonForm>;
  
  person?: PersonDto;
  workingEntries?: WorkingEntryDto[];

  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    const personId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!personId) {
      leaveDetailNotFound(this.router, this.snackbar, '/work/person');
      return;
    }

    this.contextService.byId(personId).pipe(takeUntil(this.destroy$)).subscribe({
      next: person => {
        if (!person) {
          leaveDetailNotFound(this.router, this.snackbar, '/work/person');
          return;
        }

        this.person = person;
        this.form = getPersonForm(person);
        this.form.disable();

        // Kopfzeile: Name der Person als Titel (Mockup 05, Person)
        this.pageTitleService.set(person.name);
        this.initSubscriptions();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.form = getPersonForm(this.person!);
    this.form.disable();
  }

  onAddPaymentClick(): void {
    this.personPaymentDialogService
      .openDialog({
        personId: this.person!.id,
        openHours: calculateTimeDifference(this.person!.totalHours, this.person!.payedHours)
      });
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createUpdateDtoFromForm();

    this.contextService.updatePerson(this.person!.id, dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.person = { ...this.person!, ...dto };
          this.pageTitleService.set(dto.name);
        },
        error: _ => {
          this.isSaving = false;
          this.isEditing = true;
          this.form.enable();
          openErrorSnackbar("Person konnte nicht gespeichert werden.", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll diese Person und alle Arbeitszeiten wirklich gelöscht werden?'
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

  getTimeDisplayName(time: Time): string {
    return createTimeDisplayName(time);
  }

  calculateTimeDifference(left: Time, right: Time): Time {
    return calculateTimeDifference(left, right);
  }
  
  private delete(): void {
    this.isDeleting = true;

    this.contextService.deletePerson(this.person!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          this.router.navigateByUrl('/work/person');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Person konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }
    
  private initSubscriptions(): void {
    this.contextService.persons().pipe(takeUntil(this.destroy$)).subscribe({
      next: persons => {
        const updated = persons?.find(p => p.id == this.person?.id);
        if (!updated) {
          return;
        }

        this.person = updated;
        if (!this.isEditing && !this.isSaving) {
          this.form = getPersonForm(updated);
          this.form.disable();
        }
      }
    });

    this.workingEntryContextService.workingEntries().pipe(takeUntil(this.destroy$)).subscribe({
      next: entries => {
        this.workingEntries = entries;
      }
    });

    this.workingEntryContextService.loading().pipe(takeUntil(this.destroy$)).subscribe({
      next: loading => this.isLoading = loading
    })
  }

  private createUpdateDtoFromForm(): UpdatePersonDto {
    const controls = this.form.controls;
    return {
      name: controls.name.value,
      hourlyRate: controls.hourlyRate.value,
      notes: controls.notes?.value ?? undefined,
    }
  }
}
