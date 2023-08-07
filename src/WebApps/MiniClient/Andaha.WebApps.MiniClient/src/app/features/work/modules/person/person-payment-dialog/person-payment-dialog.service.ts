import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PersonPaymentDialogData } from './PersonPaymentDialogData';
import { PersonPaymentDialogComponent } from './person-payment-dialog.component';
import { ComponentType } from '@angular/cdk/portal';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';

@Injectable({
  providedIn: 'root'
})
export class PersonPaymentDialogService {

  constructor(private dialog: MatDialog) { }

  async openDialog(data: PersonPaymentDialogData): Promise<MatDialogRef<PersonPaymentDialogComponent, string>> {
    const chunk = await import(`./person-payment-dialog.component`);

    const dialogComponent = Object.values(chunk)[0] as ComponentType<PersonPaymentDialogComponent>;

    const config = getDialogBaseConfig();
    config.data = data;

    return this.dialog.open(dialogComponent, config);
  }
}
