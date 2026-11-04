import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
  data = inject<InformationSnackbarData>(MAT_SNACK_BAR_DATA);
  private snackbarRef = inject<MatSnackBarRef<InformationSnackbarComponent>>(MatSnackBarRef);


  dismiss() {
    this.snackbarRef.dismiss();
  }

  runAction() {
    this.snackbarRef.dismissWithAction();
  }
}
