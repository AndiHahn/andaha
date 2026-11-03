import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface InformationSnackbarData {
  message: string;
  action?: string;
}

@Component({
  selector: 'app-information-snackbar',
  templateUrl: './information-snackbar.component.html',
  styleUrls: ['./information-snackbar.component.scss']
})
export class InformationSnackbarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: InformationSnackbarData, private snackbarRef: MatSnackBarRef<InformationSnackbarComponent>) {}

  dismiss() {
    this.snackbarRef.dismiss();
  }

  runAction() {
    this.snackbarRef.dismissWithAction();
  }
}
