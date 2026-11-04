import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { getTotalWorkingTimeString } from '../../../functions/date-time-functions';
import { WorkEntryDetailsDialogService } from '../work-entry-details/work-entry-details-dialog.service';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-work-entry-list',
    templateUrl: './work-entry-list.component.html',
    styleUrls: ['./work-entry-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DatePipe]
})
export class WorkEntryListComponent implements OnInit {
  private workEntryContextService = inject(WorkingEntriesContextService);
  private workEntryDetailsDialogService = inject(WorkEntryDetailsDialogService);


  @Input()
  workEntries!: WorkingEntryDto[];

  ngOnInit(): void {
    if (!this.workEntries) {
      throw new Error("Work entries must be provided in order to use this component.");
    }
  }

  getTotalWorkingTime(workingEntry: WorkingEntryDto): string {
    return getTotalWorkingTimeString(
      {
        from: workingEntry.from,
        until: workingEntry.until,
        break: workingEntry.break
      }
    );
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
                this.workEntryContextService.refetch();
              }
            }
          }
        ));
  }
}
