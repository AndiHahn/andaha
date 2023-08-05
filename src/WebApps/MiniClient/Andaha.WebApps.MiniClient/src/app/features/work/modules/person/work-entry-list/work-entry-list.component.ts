import { Component, Input, OnInit } from '@angular/core';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { getTotalWorkingTimeString } from '../../../functions/working-time-functions';

@Component({
  selector: 'app-work-entry-list',
  templateUrl: './work-entry-list.component.html',
  styleUrls: ['./work-entry-list.component.scss']
})
export class WorkEntryListComponent implements OnInit {

  @Input()
  workEntries!: WorkingEntryDto[];

  constructor() { }

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
}
