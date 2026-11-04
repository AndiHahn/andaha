import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';

export interface InformationSnackbarData {
  message: string;
  action?: string;
}

@Component({
    selector: 'app-information-snackbar',
    templateUrl: './information-snackbar.component.html',
    styleUrls: ['./information-snackbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon]
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
