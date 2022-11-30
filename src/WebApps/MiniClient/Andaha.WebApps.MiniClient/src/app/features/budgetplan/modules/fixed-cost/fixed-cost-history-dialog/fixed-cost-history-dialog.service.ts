import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { FixedCostHistoryDialogComponent } from './fixed-cost-history-dialog.component';
import { FixedCostHistoryDialogData } from './FixedCostHistoryDialogData';

@Injectable({
  providedIn: 'root'
})
export class FixedCostHistoryDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(data: FixedCostHistoryDialogData): Promise<MatDialogRef<FixedCostHistoryDialogComponent, boolean | undefined>> {
    const chunk = await import(`./fixed-cost-history-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<FixedCostHistoryDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
