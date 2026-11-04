import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-error-snackbar',
    templateUrl: './error-snackbar.component.html',
    styleUrls: ['./error-snackbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon]
})
export class ErrorSnackbarComponent {
  message = inject(MAT_SNACK_BAR_DATA);
  private snackbarRef = inject<MatSnackBarRef<ErrorSnackbarComponent>>(MatSnackBarRef);


  dismiss() {
    this.snackbarRef.dismiss();
  }
}
