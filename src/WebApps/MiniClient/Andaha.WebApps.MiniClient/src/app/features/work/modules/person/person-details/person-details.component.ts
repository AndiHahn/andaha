import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { PersonContextService } from '../../../services/person-context.service';
import { FormGroup } from '@angular/forms';
import { PersonForm, getPersonForm } from '../../../functions/person-form-functions';
import { UpdatePersonDto } from 'src/app/api/work/dtos/PersonUpdateDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { Subject, takeUntil } from 'rxjs';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { Time } from '@angular/common';
import { addTimes, calculateTimeDifference, createTimeDisplayName } from '../../../functions/date-time-functions';
import { PersonPaymentDialogService } from '../person-payment-dialog/person-payment-dialog.service';
import { getHoursFromTimeString, getMinutesFromTimeString } from 'src/app/api/functions/api-utils';

@Component({
  selector: 'app-person-details',
  templateUrl: './person-details.component.html',
  styleUrls: ['./person-details.component.scss'],
  providers: [WorkingEntriesContextService]
})
export class PersonDetailsComponent implements OnInit, OnDestroy {

  form: FormGroup<PersonForm>;
  
  person: PersonDto;
  workingEntries?: WorkingEntryDto[];

  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private contextService: PersonContextService, 
    private confirmationDialog: ConfirmationDialogService,
    private personPaymentDialogService: PersonPaymentDialogService,
    private workingEntryContextService: WorkingEntriesContextService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    const personId = params["id"];
    if (!personId) {
      throw new Error("No personId available.");
    }

    const person = this.contextService.getById(personId);
    if (!person) {
      throw new Error("Person with id: " + personId + " is not available.");
    }

    this.person = person;
    this.form = getPersonForm(person);
    this.form.disable();
  }

  ngOnInit(): void {
    this.initSubscriptions();
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
    this.form = getPersonForm(this.person);
    this.form.disable();
  }

  onAddPaymentClick(): void {
    this.personPaymentDialogService
      .openDialog({
        personId: this.person.id,
        openHours: calculateTimeDifference(this.person.totalHours, this.person.payedHours)
      })
      .then(dialogRef => dialogRef.afterClosed().subscribe({
        next: payedHours => {
          const payedNow = {
            hours: getHoursFromTimeString(payedHours!),
            minutes: getMinutesFromTimeString(payedHours!)
          }

          this.person.payedHours = addTimes(this.person.payedHours, payedNow);
        }
      }));
  }

  onSaveClick(): void {
    if (!this.form.valid) {
      return;
    }

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const dto = this.createUpdateDtoFromForm();

    this.contextService.updatePerson(this.person.id, dto).subscribe(
      {
        next: _ => this.isSaving = false,
        error: _ => {
          this.isSaving = false;
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

    this.contextService.deletePerson(this.person.id).subscribe(
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
