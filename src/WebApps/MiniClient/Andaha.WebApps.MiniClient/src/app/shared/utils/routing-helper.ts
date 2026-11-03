import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
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

export function leaveDetailNotFound(router: Router, snackbar: MatSnackBar, listUrl: string): void {
  openInformationSnackbar('Eintrag wurde nicht gefunden.', snackbar);
  router.navigateByUrl(listUrl);
}
