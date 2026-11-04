import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { ConfirmationDialogData } from './ConfirmationDialogData';
import { DialogComponent } from '../dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent]
})
export class ConfirmationDialogComponent {
  dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);


  dialogData: ConfirmationDialogData;

  constructor() {
    const data = this.data;

    this.dialogData = data;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onAcceptClick(): void {
    this.dialogRef.close(true);
  }
}
