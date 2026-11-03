import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ErrorSnackbarComponent } from './error-snackbar/error-snackbar.component';
import { InformationSnackbarComponent, InformationSnackbarData } from './information-snackbar/information-snackbar.component';

export function openErrorSnackbar(message: string, snackbar: MatSnackBar) {
  snackbar.openFromComponent(ErrorSnackbarComponent, { data: message, panelClass: ['andaha-snackbar', 'andaha-snackbar-error'], duration: 5000 });
}

export function openInformationSnackbar(
  message: string,
  snackbar: MatSnackBar,
  options?: { action?: string; duration?: number | null }
): MatSnackBarRef<InformationSnackbarComponent> {
  const data: InformationSnackbarData = { message, action: options?.action };
  // duration: null = bleibt stehen (MatSnackBar: 0 = kein Auto-Dismiss)
  const duration = options?.duration === null ? undefined : options?.duration ?? 3000;
  return snackbar.openFromComponent(InformationSnackbarComponent, { data, panelClass: ['andaha-snackbar', 'andaha-snackbar-info'], duration });
}
