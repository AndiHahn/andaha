import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AnalyzedBillImageDialogComponent } from './analyzed-bill-image-dialog.component';

@Injectable({ providedIn: 'root' })
export class AnalyzedBillImageDialogService {
  constructor(private dialog: MatDialog) {}

  openDialog(billId: string) {
    return this.dialog.open(AnalyzedBillImageDialogComponent, { data: { billId } });
  }
}
