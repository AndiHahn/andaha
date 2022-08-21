import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-information-snackbar',
  templateUrl: './information-snackbar.component.html',
  styleUrls: ['./information-snackbar.component.scss']
})
export class InformationSnackbarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public message: string, private snackbarRef: MatSnackBarRef<InformationSnackbarComponent>) {}

  dismiss() {
    this.snackbarRef.dismiss();
  }
}
