import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { AddBillImageDialogComponent, ImageSnippet } from './add-bill-image-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AddBillImageDialogService {
  
  constructor(private dialog: MatDialog) { }

  async openDialog(): Promise<MatDialogRef<AddBillImageDialogComponent, ImageSnippet>> {
    const chunk = await import(`./add-bill-image-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<AddBillImageDialogComponent>;

    const config = getDialogBaseConfig();

    return this.dialog.open(dialogComponent, config);
  }
}
