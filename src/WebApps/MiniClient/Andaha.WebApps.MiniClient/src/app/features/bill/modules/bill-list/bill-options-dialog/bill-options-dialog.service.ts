import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BillOptionsDialogComponent } from './bill-options-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class BillOptionsDialogService {
  
  constructor(private dialog: MatDialog) { }

  async openDialog(billId: string): Promise<MatDialogRef<BillOptionsDialogComponent>> {
    const chunk = await import(`./bill-options-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<BillOptionsDialogComponent>;

    return this.dialog.open(dialogComponent, { data: { billId: billId }, width: '80%'});
  }
}
