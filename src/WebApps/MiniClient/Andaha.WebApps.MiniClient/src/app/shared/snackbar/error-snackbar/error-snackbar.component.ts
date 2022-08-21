import { Component, Inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-error-snackbar',
  templateUrl: './error-snackbar.component.html',
  styleUrls: ['./error-snackbar.component.scss'],
})
export class ErrorSnackbarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public message: string, private snackbarRef: MatSnackBarRef<ErrorSnackbarComponent>) {}

  dismiss() {
    this.snackbarRef.dismiss();
  }
}
