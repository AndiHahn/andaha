import { ActivatedRouteSnapshot } from "@angular/router";

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
