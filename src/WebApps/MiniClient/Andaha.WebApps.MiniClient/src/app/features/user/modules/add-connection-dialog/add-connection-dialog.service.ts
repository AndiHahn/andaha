import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddConnectionDialogComponent } from './add-connection-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AddConnectionDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(): Promise<MatDialogRef<AddConnectionDialogComponent>> {
    const chunk = await import(`./add-connection-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<AddConnectionDialogComponent>;

    return this.dialog.open(dialogComponent);
  }
}
