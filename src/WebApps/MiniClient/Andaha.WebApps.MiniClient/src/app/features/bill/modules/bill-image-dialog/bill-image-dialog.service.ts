import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { BillImageDialogComponent } from './bill-image-dialog.component';
import { BillImageDialogData } from './BillImageDialogData';

@Injectable({
  providedIn: 'root'
})
export class BillImageDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(data: BillImageDialogData): Promise<MatDialogRef<BillImageDialogComponent, boolean | undefined>> {
    const chunk = await import(`./bill-image-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<BillImageDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
