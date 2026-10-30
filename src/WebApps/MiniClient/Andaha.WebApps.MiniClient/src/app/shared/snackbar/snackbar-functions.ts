import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorSnackbarComponent } from './error-snackbar/error-snackbar.component';
import { InformationSnackbarComponent } from './information-snackbar/information-snackbar.component';

export function openErrorSnackbar(message: string, snackbar: MatSnackBar) {
  snackbar.openFromComponent(ErrorSnackbarComponent, { data: message, panelClass: ['andaha-snackbar', 'andaha-snackbar-error'], duration: 5000 });
}

export function openInformationSnackbar(message: string, snackbar: MatSnackBar) {
  snackbar.openFromComponent(InformationSnackbarComponent, { data: message, panelClass: ['andaha-snackbar', 'andaha-snackbar-info'], duration: 3000 });
}
