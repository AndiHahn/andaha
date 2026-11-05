import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { SKIP_GLOBAL_ERROR } from './skip-global-error';

const OFFLINE_MESSAGE = 'Keine Verbindung zum Server';
const SERVER_ERROR_MESSAGE = 'Etwas ist schiefgelaufen. Bitte später erneut versuchen.';

/**
 * Einheitliche Fehler-Snackbar (AC33): Status 0 (Netzfehler) und >= 500. 4xx bleibt den Komponenten
 * überlassen, ebenso Anfragen mit SKIP_GLOBAL_ERROR. Der Fehler wird immer an den Aufrufer weitergereicht.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // inject nur synchron im Interceptor-Kontext möglich, nicht erst in catchError
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.context.get(SKIP_GLOBAL_ERROR)) {
        const message = globalErrorMessage(error.status);
        if (message) {
          openErrorSnackbar(message, snackBar);
        }
      }
      return throwError(() => error);
    })
  );
};

function globalErrorMessage(status: number): string | null {
  if (status === 0) {
    return OFFLINE_MESSAGE;
  }
  return status >= 500 ? SERVER_ERROR_MESSAGE : null;
}
