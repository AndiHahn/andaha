import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogData } from './ConfirmationDialogData';
import { getDialogBaseConfig } from "../dialog/dialog-functions";

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialog = inject(MatDialog);


  async openDialog(data: ConfirmationDialogData): Promise<MatDialogRef<ConfirmationDialogComponent>> {
    const chunk = await import(`./confirmation-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<ConfirmationDialogComponent>;

    return this.dialog.open(dialogComponent, { ...getDialogBaseConfig(), data: data });
  }
}
