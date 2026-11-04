import { NavigationEnd, Router } from '@angular/router';
import { defer, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

/** Aktuelle URL nach Redirects, aktualisiert bei jedem Navigationsende. Startwert ist die URL beim Abonnieren. */
export function currentUrl$(router: Router): Observable<string> {
  return defer(() => router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects),
    startWith(router.url)));
}
