import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AnalyzedBillImageDialogComponent } from './analyzed-bill-image-dialog.component';
import { getDialogBaseConfig } from "src/app/shared/dialog/dialog-functions";

@Injectable({ providedIn: 'root' })
export class AnalyzedBillImageDialogService {
  private dialog = inject(MatDialog);


  openDialog(billId: string) {
    return this.dialog.open(AnalyzedBillImageDialogComponent, { ...getDialogBaseConfig(), data: { billId } });
  }
}
