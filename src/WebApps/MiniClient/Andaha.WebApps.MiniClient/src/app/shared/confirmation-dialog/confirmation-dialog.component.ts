import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
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

  dialogData: ConfirmationDialogData;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    this.dialogData = data;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onAcceptClick(): void {
    this.dialogRef.close(true);
  }
}
