import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WorkEntryDetailsDialogData } from './WorkEntryDetailsDialogData';
import { WorkEntryDetailsDialogComponent } from './work-entry-details-dialog.component';
import { ComponentType } from '@angular/cdk/portal';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';

@Injectable({
  providedIn: 'root'
})
export class WorkEntryDetailsDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(data: WorkEntryDetailsDialogData): Promise<MatDialogRef<WorkEntryDetailsDialogComponent, string>> {
    const chunk = await import(`./work-entry-details-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<WorkEntryDetailsDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
