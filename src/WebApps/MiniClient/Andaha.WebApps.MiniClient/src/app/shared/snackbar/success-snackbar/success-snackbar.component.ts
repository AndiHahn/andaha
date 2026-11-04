import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-success-snackbar',
    templateUrl: './success-snackbar.component.html',
    styleUrls: ['./success-snackbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon]
})
export class SuccessSnackbarComponent {
  message = inject<string>(MAT_SNACK_BAR_DATA);
}
