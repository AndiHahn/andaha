import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRouteSnapshot } from "@angular/router";
import { HistoryTrailService } from "src/app/core/navigation/history-trail.service";
import { openInformationSnackbar } from "../snackbar/snackbar-functions";

export interface RouteParameterLike {
  [key: string]: any;
}

export function getParametersFromRouteRecursive<T extends RouteParameterLike>(
  route: ActivatedRouteSnapshot,
  snapToTopLevel: boolean = true
): T {
  if (snapToTopLevel) {
    while (route.parent) {
      route = route.parent;
    }
  }
  let parameters = { ...route.params };
  if (route.children) {
    for (const child of route.children) {
      parameters = { ...parameters, ...getParametersFromRouteRecursive(child, false) };
    }
  }
  return parameters as any;
}

/**
 * Detailseite ohne (noch vorhandenen) Eintrag verlassen: zurück zur Liste, wenn sie darunter liegt,
 * sonst ersetzt die Liste die Seite. Nie ein neuer Eintrag, sonst führte Zurück wieder hierher (I1).
 */
export function leaveDetailNotFound(historyTrail: HistoryTrailService, snackbar: MatSnackBar, listUrl: string): void {
  openInformationSnackbar('Eintrag wurde nicht gefunden.', snackbar);
  historyTrail.leaveTo(listUrl);
}
