import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentDto } from 'src/app/api/work/dtos/PaymentDto';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { vibrate } from 'src/app/shared/utils/haptics';
import { openAmount, openMinutes } from '../../../functions/payment-functions';
import { PersonPaymentDialogData } from '../person-payment-dialog/PersonPaymentDialogData';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
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
import { calculateTimeDifference, formatDuration, timeToMinutes } from '../../../functions/date-time-functions';
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
    imports: [FormsModule, ReactiveFormsModule, LoadStateComponent, WorkEntryListComponent, MatProgressBar, MatIcon, MatProgressSpinner, DecimalPipe, DatePipe, ShowErrorPipe]
})
export class PersonDetailsComponent implements OnInit, OnDestroy {
  private historyTrail = inject(HistoryTrailService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private contextService = inject(PersonContextService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private personPaymentDialogService = inject(PersonPaymentDialogService);
  private workingEntryContextService = inject(WorkingEntriesContextService);
  private pageTitleService = inject(PageTitleService);

  readonly entriesError = this.workingEntryContextService.error;

  form!: FormGroup<PersonForm>;
  
  person?: PersonDto;
  workingEntries?: WorkingEntryDto[];

  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  get entriesLoadState(): LoadState {
    if (this.entriesError()) {
      return 'error';
    }
    if (!this.workingEntries) {
      return 'loading';
    }

    return this.workingEntries.length == 0 ? 'empty' : 'ready';
  }

  ngOnInit(): void {
    const personId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!personId) {
      leaveDetailNotFound(this.historyTrail, this.snackbar, '/work/person');
      return;
    }

    this.contextService.byId(personId).pipe(takeUntil(this.destroy$)).subscribe({
      next: person => {
        if (!person) {
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/work/person');
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

  /** Erfassung mit vorgewählter Person (AC13); den Query-Parameter liest die Erfassung */
  onAddWorkingEntryClick(): void {
    void this.router.navigate(['/work/person/create-working-entry'], { queryParams: { person: this.person!.id } });
  }

  onAddPaymentClick(): void {
    this.personPaymentDialogService.openDialog(this.paymentDialogData());
  }

  onEditPaymentClick(payment: PaymentDto): void {
    this.personPaymentDialogService.openDialog({ ...this.paymentDialogData(), payment });
  }

  onDeletePaymentClick(payment: PaymentDto): void {
    const data: ConfirmationDialogData = {
      text: 'Soll diese Zahlung wirklich gelöscht werden?'
    }

    this.confirmationDialog.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: confirmed => {
          if (confirmed) {
            this.deletePayment(payment);
          }
        }
      }
    ));
  }

  onRetryEntriesClick(): void {
    this.workingEntryContextService.retry();
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

  /** Dauer als „h:mm“, z. B. „86:30“ bzw. „8:30“ (Mockup 02 C) */
  formatTime(time: Time): string {
    return formatDuration(timeToMinutes(time));
  }

  openHoursDisplayName(person: PersonDto): string {
    return formatDuration(openMinutes(person));
  }

  openAmount(person: PersonDto): number {
    return openAmount(person);
  }

  private paymentDialogData(): PersonPaymentDialogData {
    return {
      personId: this.person!.id,
      hourlyRate: this.person!.hourlyRate,
      openHours: calculateTimeDifference(this.person!.totalHours, this.person!.payedHours)
    };
  }

  private deletePayment(payment: PaymentDto): void {
    this.isDeleting = true;

    // bezahlte Stunden und Zahlungen kommen danach neu vom Backend (PersonContextService)
    this.contextService.deletePayment(this.person!.id, payment.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          vibrate();
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Zahlung konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }
  
  private delete(): void {
    this.isDeleting = true;

    this.contextService.deletePerson(this.person!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          vibrate();
          // zurück zur Liste; Zurück führt danach nicht auf den gelöschten Eintrag
          this.historyTrail.leaveTo('/work/person');
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
