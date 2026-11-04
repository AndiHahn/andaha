import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
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
  private fixedCostApiService = inject(FixedCostApiService);


  historyEntries?: FixedCostHistoryDto[];

  durationLabel = DurationLabel;
  
  constructor() {
    const data = inject<FixedCostHistoryDialogData>(MAT_DIALOG_DATA);

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
