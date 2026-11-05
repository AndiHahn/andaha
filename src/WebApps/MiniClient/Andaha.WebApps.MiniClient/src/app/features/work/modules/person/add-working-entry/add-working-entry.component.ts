import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateWorkingEntriesDto } from 'src/app/api/work/dtos/CreateWorkingEntriesDto';
import { ActivatedRoute } from '@angular/router';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { StatisticsContextService } from '../../../services/statistics-context.service';
import {
  BREAK_TOO_LONG_TEXT, UNTIL_BEFORE_FROM_TEXT, WorkingEntryForm, applyPickedTime, getEmptyWorkingEntryForm,
  getFormWorkTime, getNetWorkingTimeText
} from '../../../functions/working-entry-form-functions';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkingEntriesContextGlobalService } from '../../../services/working-entries-context-global.service';
import moment from "moment";
import { PersonContextService } from '../../../services/person-context.service';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { formatLocalTime } from '../../../functions/date-time-functions';
import { formatTime } from 'src/app/api/functions/api-utils';
import { MatSelect, MatSelectTrigger, MatOption } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { DatePickerFormFieldComponent } from '../../../../../shared/date-picker/date-picker-form-field/date-picker-form-field.component';
import { TimePickerFormFieldComponent } from '../../../../../shared/date-picker/time-picker-form-field/time-picker-form-field.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-add-working-entry',
    templateUrl: './add-working-entry.component.html',
    styleUrls: ['./add-working-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, FormsModule, ReactiveFormsModule, MatSelect, MatSelectTrigger, MatInput, MatOption, MatIcon, DatePickerFormFieldComponent, TimePickerFormFieldComponent, MatProgressSpinner, ShowErrorPipe]
})
export class AddWorkingEntryComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private personContextService = inject(PersonContextService);
  private destroyRef = inject(DestroyRef);
  private contextService = inject(WorkingEntriesContextGlobalService);
  private workingEntryApiService = inject(WorkingEntryApiService);
  private statisticsContextService = inject(StatisticsContextService);
  private route = inject(ActivatedRoute);

  private pageTitleService = inject(PageTitleService);
  private historyTrail = inject(HistoryTrailService);

  /** Personenseite, von der die Seite geöffnet wurde (`?person=`), sonst undefined */
  private personPageUrl?: string;

  /** Neuester Eintrag der einzigen gewählten Person (Zeile „Letzter Eintrag“) */
  lastEntry?: WorkingEntryDto;

  form: FormGroup<WorkingEntryForm>;

  persons?: PersonDto[];
  filteredPersons?: PersonDto[];

  isSaving: boolean = false;

  constructor() {
    this.form = getEmptyWorkingEntryForm();
  }

  ngOnInit(): void {
    // von einer Personenseite geöffnet: Zurück und Speichern führen dorthin, sonst zur Personenliste (data.back)
    const personId = this.route.snapshot.queryParamMap.get('person');
    if (personId) {
      this.personPageUrl = `/work/person/${personId}`;
      this.pageTitleService.setBack(this.personPageUrl);
    }

    // „Letzter Eintrag“ gibt es nur bei genau einer gewählten Person
    this.form.controls.selectedPersons.valueChanges.pipe(
      map(selected => selected.length === 1 ? selected[0].id : undefined),
      distinctUntilChanged(),
      tap(() => this.lastEntry = undefined),
      switchMap(personId => personId
        ? this.workingEntryApiService.listWorkingEntryMonths(personId, undefined, 1).pipe(catchError(() => of(undefined)))
        : of(undefined)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => this.lastEntry = result?.entries[0]);

    this.personContextService.persons().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: persons => {
          if (!this.persons) {
            this.persons = persons;
            this.filteredPersons = persons;
            this.preselectPerson(persons);
          }
        }
      }
    );
  }

  private preselectPerson(persons: PersonDto[] | undefined): void {
    const personId = this.route.snapshot.queryParamMap.get('person');
    const person = persons?.find(candidate => candidate.id === personId);
    if (person) {
      this.form.controls.selectedPersons.setValue([person]);
    }
  }

  /** „Letzter Eintrag: 04.11. · 07:00 – 12:30“ */
  getLastEntryText(): string {
    const entry = this.lastEntry;
    return entry
      ? `Letzter Eintrag: ${moment(entry.from).format('DD.MM.')} · ${formatLocalTime(entry.from)} – ${formatLocalTime(entry.until)}`
      : '';
  }

  /** Beginn, Ende, Pause und Notiz des letzten Eintrags übernehmen; das Datum bleibt */
  copyLastEntry(): void {
    const entry = this.lastEntry;
    if (!entry) {
      return;
    }

    applyPickedTime(this.form.controls.fromTime, formatLocalTime(entry.from));
    applyPickedTime(this.form.controls.untilTime, formatLocalTime(entry.until));
    this.form.controls.break.setValue({ hours: entry.break.hours, minutes: entry.break.minutes });
    this.form.controls.notes.setValue(entry.notes ?? null);
  }

  onInputChange(event: any) {
    if (!this.persons) {
      return;
    }

    const searchInput = event.target.value.toLowerCase();

    this.filteredPersons = this.persons.filter(({ name }) => {
      const personName = name.toLowerCase();
      return personName.includes(searchInput);
    });
  }

  onOpenChange(searchInput: any) {
    searchInput.value = "";
    this.filteredPersons = this.persons;
  }

  getNgxTime(control: FormControl) : string {
    return moment(control.value).format('HH:mm');
  }

  setFormTime(control: FormControl, newTime: string): void {
    applyPickedTime(control, newTime);
  }

  get untilError(): string | null {
    return this.form.hasError('untilNotAfterFrom') ? UNTIL_BEFORE_FROM_TEXT : null;
  }

  get breakError(): string | null {
    return this.form.hasError('breakTooLong') ? BREAK_TOO_LONG_TEXT : null;
  }

  getPersonDisplayText(): string {
    const personNames = this.form.controls.selectedPersons.value.map(person => person.name);

    return personNames.join(", ");
  }

  getWorkingTime(): string {
    return getNetWorkingTimeText(this.form);
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.contextService.createEntries(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.form.controls.selectedPersons.reset();
          this.personContextService.refetch();
          this.statisticsContextService.refreshTimeRange();
          openInformationSnackbar('Arbeitszeit wurde gespeichert', this.snackbar);
          if (this.personPageUrl) {
            this.historyTrail.leaveTo(this.personPageUrl);
          }
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Arbeitszeit konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
  }

  private createDtoFromForm(): CreateWorkingEntriesDto {
    const controls = this.form.controls;
    const workTime = getFormWorkTime(this.form)!;

    return {
      from: workTime.from,
      until: workTime.until,
      break: formatTime(controls.break.value),
      personIds: controls.selectedPersons.value.map(person => person.id),
      notes: controls.notes?.value ?? undefined
    }
  }
}
