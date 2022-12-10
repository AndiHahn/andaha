import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { IncomeHistoryDialogComponent } from './income-history-dialog.component';
import { IncomeHistoryDialogData } from './IncomeHistoryDialogData';

@Injectable({
  providedIn: 'root'
})
export class IncomeHistoryDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(data: IncomeHistoryDialogData): Promise<MatDialogRef<IncomeHistoryDialogComponent, boolean | undefined>> {
    const chunk = await import(`./income-history-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<IncomeHistoryDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
