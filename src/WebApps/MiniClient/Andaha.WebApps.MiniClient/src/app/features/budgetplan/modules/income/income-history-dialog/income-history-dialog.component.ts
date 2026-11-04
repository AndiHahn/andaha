import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeHistoryDto } from 'src/app/api/budgetplan/dtos/IncomeHistoryDto';
import { IncomeApiService } from 'src/app/api/budgetplan/income-api.service';
import { IncomeHistoryDialogData } from './IncomeHistoryDialogData';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-income-history-dialog',
    templateUrl: './income-history-dialog.component.html',
    styleUrls: ['./income-history-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, MatProgressSpinner, DecimalPipe, DatePipe]
})
export class IncomeHistoryDialogComponent implements OnInit {
  private incomeApiService = inject(IncomeApiService);


  historyEntries?: IncomeHistoryDto[];

  durationLabel = DurationLabel;
  
  constructor() {
    const data = inject<IncomeHistoryDialogData>(MAT_DIALOG_DATA);

    this.fetchHistory(data.incomeId);
  }

  ngOnInit(): void {
  }

  private fetchHistory(id: string): void {
    this.incomeApiService.history(id).subscribe(
      {
        next: history => this.historyEntries = history.sort((left, right) => right.validFrom.getTime() - left.validFrom.getTime())
      }
    );
  }
}
