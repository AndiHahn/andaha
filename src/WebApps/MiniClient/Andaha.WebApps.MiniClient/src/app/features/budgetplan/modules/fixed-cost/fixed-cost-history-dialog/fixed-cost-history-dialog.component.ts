import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostHistoryDto } from 'src/app/api/budgetplan/dtos/FixedCostHistoryDto';
import { FixedCostApiService } from 'src/app/api/budgetplan/fixedcost-api.service';
import { FixedCostHistoryDialogData } from './FixedCostHistoryDialogData';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-fixed-cost-history-dialog',
    templateUrl: './fixed-cost-history-dialog.component.html',
    styleUrls: ['./fixed-cost-history-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, MatProgressSpinner, DecimalPipe, DatePipe]
})
export class FixedCostHistoryDialogComponent implements OnInit {

  historyEntries?: FixedCostHistoryDto[];

  durationLabel = DurationLabel;
  
  constructor(
    private fixedCostApiService: FixedCostApiService,
    @Inject(MAT_DIALOG_DATA) data: FixedCostHistoryDialogData
  ) {
    this.fetchHistory(data.fixedCostId);
  }

  ngOnInit(): void {
  }

  private fetchHistory(id: string): void {
    this.fixedCostApiService.history(id).subscribe(
      {
        next: history => this.historyEntries = history.sort((left, right) => right.validFrom.getTime() - left.validFrom.getTime())
      }
    );
  }
}
