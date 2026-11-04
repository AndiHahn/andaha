import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { finalize, take } from 'rxjs/operators';
import { ExpenseContextService } from '../bill/services/expense-context.service';
import { PersonContextService } from '../work/services/person-context.service';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon, MatProgressSpinner]
})
export class ExportComponent implements OnInit {

  exporting: 'expenses' | 'work' | null = null;

  constructor(
    private expenseContextService: ExpenseContextService,
    private personContextService: PersonContextService) { }

  ngOnInit(): void {
  }

  onExportExpensesClick() {
    this.exporting = 'expenses';

    this.expenseContextService.downloadExpenses()
      .pipe(take(1), finalize(() => this.exporting = null))
      .subscribe({ error: _ => { } });
  }

  onExportWorkInformationClick() {
    this.exporting = 'work';

    this.personContextService.downloadPersonInformations()
      .pipe(take(1), finalize(() => this.exporting = null))
      .subscribe({ error: _ => { } });
  }
}
