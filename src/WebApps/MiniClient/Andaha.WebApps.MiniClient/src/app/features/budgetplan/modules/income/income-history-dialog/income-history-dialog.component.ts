import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

  historyEntries?: IncomeHistoryDto[];

  durationLabel = DurationLabel;
  
  constructor(
    private incomeApiService: IncomeApiService,
    @Inject(MAT_DIALOG_DATA) data: IncomeHistoryDialogData
  ) {
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
