import { map, Observable, race, take, timer } from 'rxjs';

export const LOAD_STATE_OFFLINE_TIMEOUT_MS = 10000;
export const LOAD_STATE_ONLINE_TIMEOUT_MS = 45000;

// Offline kommt nie ein Ladezustand; online darf ein kaltgestartetes Backend laenger brauchen
export function loadStateTimeoutMs(): number {
  return navigator.onLine === false ? LOAD_STATE_OFFLINE_TIMEOUT_MS : LOAD_STATE_ONLINE_TIMEOUT_MS;
}

/**
 * Emits exactly once and completes: as soon as the first load state arrived, or after the
 * timeout (e.g. offline reload where the backend never becomes ready). The value is
 * whatever is loaded at that moment.
 */
export function afterFirstLoad<T>(loadState$: Observable<unknown>, getValue: () => T): Observable<T> {
  return race(loadState$, timer(loadStateTimeoutMs())).pipe(take(1), map(() => getValue()));
}
