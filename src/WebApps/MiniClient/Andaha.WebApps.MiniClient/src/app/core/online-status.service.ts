import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';

/** Verbindungsstatus des Browsers (navigator.onLine und die Events online/offline), z. B. für das Offline-Banner. */
@Injectable({
  providedIn: 'root'
})
export class OnlineStatusService {
  private readonly onlineState = signal(navigator.onLine !== false);

  readonly online: Signal<boolean> = this.onlineState.asReadonly();

  constructor() {
    const goOnline = () => this.onlineState.set(true);
    const goOffline = () => this.onlineState.set(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    });
  }
}
