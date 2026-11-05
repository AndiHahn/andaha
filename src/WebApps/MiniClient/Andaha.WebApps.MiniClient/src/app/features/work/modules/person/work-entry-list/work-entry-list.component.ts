import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { groupByMonth, monthStart } from 'src/app/shared/utils/month-groups';
import { formatDuration, timeToMinutes, workingMinutes } from '../../../functions/date-time-functions';
import { amountForMinutes } from '../../../functions/payment-functions';
import { WorkEntryDetailsDialogService } from '../work-entry-details/work-entry-details-dialog.service';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { PersonContextService } from '../../../services/person-context.service';

interface WorkEntryMonth {
  month: string;
  start: Date;
  minutes: number;
  amount: number;
  rows: { entry: WorkingEntryDto; minutes: number }[];
}

@Component({
    selector: 'app-work-entry-list',
    templateUrl: './work-entry-list.component.html',
    styleUrls: ['./work-entry-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DatePipe, DecimalPipe, MatProgressSpinner]
})
export class WorkEntryListComponent {
  private workEntryContextService = inject(WorkingEntriesContextService);
  private personContextService = inject(PersonContextService);
  private workEntryDetailsDialogService = inject(WorkEntryDetailsDialogService);

  /** geladene Einträge ganzer Monate, neueste zuerst */
  readonly workEntries = input.required<WorkingEntryDto[]>();

  /** aktueller Stundensatz für den Euro-Betrag je Monat */
  readonly hourlyRate = input(0);

  readonly hasOlder = this.workEntryContextService.hasOlder;
  readonly loadingOlder = this.workEntryContextService.loadingOlder;

  /** Monatsgruppen mit Summe in Stunden und Euro (Stunden × aktueller Stundensatz), Mockup 02 C */
  readonly months = computed<WorkEntryMonth[]>(() =>
    groupByMonth(this.workEntries(), entry => entry.from).map(group => {
      const rows = group.items.map(entry => ({ entry, minutes: workingMinutes(entry) }));
      const minutes = rows.reduce((sum, row) => sum + row.minutes, 0);

      return {
        month: group.month,
        start: monthStart(group.month),
        minutes,
        amount: amountForMinutes(minutes, this.hourlyRate()),
        rows
      };
    }));

  formatDuration(minutes: number): string {
    return formatDuration(minutes);
  }

  formatBreak(entry: WorkingEntryDto): string {
    return formatDuration(timeToMinutes(entry.break));
  }

  onLoadOlderClick(): void {
    this.workEntryContextService.loadOlder();
  }

  onOpenWorkEntryDetails(workEntry: WorkingEntryDto): void {
    this.workEntryDetailsDialogService
      .openDialog(
        {
          workEntry: workEntry
        }
      )
      .then(dialogRef => dialogRef.afterClosed()
        .subscribe(
          {
            next: updatedOrDeleted => {
              if (updatedOrDeleted) {
                // Einträge und Person neu laden: Monatssummen und Gesamtstunden stimmen sofort (AC23)
                this.workEntryContextService.refetch();
                this.personContextService.refetch();
              }
            }
          }
        ));
  }
}
