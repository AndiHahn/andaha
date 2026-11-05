import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Anfragen, deren Aufrufer selbst eine genauere Meldung zeigt (z. B. das Offline-Speichern von Rechnungen),
 * setzen dieses Token. Der errorInterceptor zeigt dann keine eigene Snackbar, damit es nie zwei Meldungen
 * für einen Fehler gibt.
 *
 * `http.post(url, body, { context: new HttpContext().set(SKIP_GLOBAL_ERROR, true) })`
 */
export const SKIP_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false);

/** Request-Optionen für Anfragen, deren Aufrufer bei jedem Fehler eine eigene Meldung zeigt. */
export function skipGlobalError(): { context: HttpContext } {
  return { context: new HttpContext().set(SKIP_GLOBAL_ERROR, true) };
}
