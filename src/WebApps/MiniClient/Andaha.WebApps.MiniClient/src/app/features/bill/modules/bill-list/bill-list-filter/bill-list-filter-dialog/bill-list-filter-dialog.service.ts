import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { BillListFilterDialogComponent } from './bill-list-filter-dialog.component';
import { BillListFilterDialogData } from './BillListFilterDialogData';

@Injectable({
  providedIn: 'root'
})
export class BillListFilterDialogService {
  constructor(private dialog: MatDialog) { }

  async openDialog(data: BillListFilterDialogData): Promise<MatDialogRef<BillListFilterDialogComponent, BillListFilterDialogData>> {
    const chunk = await import(`./bill-list-filter-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<BillListFilterDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
