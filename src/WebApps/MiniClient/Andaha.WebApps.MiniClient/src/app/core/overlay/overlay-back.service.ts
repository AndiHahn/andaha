import { DestroyRef, DOCUMENT, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

interface OverlayEntry {
  id: number;
  close: () => void;
  released: boolean;
}

/** Wartezeit auf das popstate eines eigenen history.back, falls der Browser keins schickt */
const TRAVERSAL_TIMEOUT = 1000;
/** So lange nach dem Start einer Navigation weg von der App (z. B. Ausloggen) kein history.back */
const LEAVING_TIMEOUT = 5000;

function markerOf(state: unknown): number {
  const marker = (state as { overlayBack?: unknown } | null)?.overlayBack;
  return typeof marker === 'number' ? marker : 0;
}

/**
 * Zurück-Taste und Zurück-Geste schließen zuerst ein offenes Sheet, einen Dialog oder ein Menü (AC6).
 *
 * Jedes Overlay bekommt einen History-Eintrag mit gleicher URL und `history.state.overlayBack = <id>`.
 * Ein popstate auf einen Eintrag unterhalb (Marker kleiner bzw. keiner) schließt alle Overlays darüber,
 * oberstes zuerst. Wird ein Overlay anders geschlossen, entfernt `history.back()` seinen Eintrag
 * wieder, sofern er noch oben liegt; das popstate dieses eigenen Schritts schließt nichts.
 * Der Router sieht beide popstate-Arten nur als Navigation auf dieselbe URL und überspringt sie;
 * Dialoge und Sheets schließen deshalb nicht selbst bei popstate (`closeOnNavigation: false`).
 *
 * Ids steigen über Neuladen hinweg (Zeitbasis), Marker aus einer früheren Sitzung sind also immer
 * kleiner als die laufenden.
 */
@Injectable({ providedIn: 'root' })
export class OverlayBackService {
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView!;

  private nextId = Date.now() * 1000;
  /** Overlay-Einträge in History-Reihenfolge, unten zuerst */
  private readonly stack: OverlayEntry[] = [];
  /** eigener history.back/go unterwegs, bis sein popstate eintrifft (Zeitgeber als Rückfall) */
  private ownTraversal: ReturnType<typeof setTimeout> | null = null;
  /** History-Schritte, die auf das Ende der eigenen Traversierung warten */
  private readonly pending: (() => void)[] = [];
  /** bis zu diesem Zeitpunkt läuft eine Navigation weg vom Dokument */
  private leavingUntil = 0;

  constructor() {
    const listener = (event: PopStateEvent) => this.onPopState(event);
    this.window.addEventListener('popstate', listener);
    // Navigation weg vom Dokument (Ausloggen aus dem Kontomenü): ein history.back danach könnte sie
    // abbrechen. Navigation API, wo vorhanden; das navigate-Ereignis kommt synchron beim Start.
    const navigation: Navigation | undefined = (this.window as Window & { navigation?: Navigation }).navigation;
    const onNavigate = (event: NavigateEvent) => {
      if (!event.destination.sameDocument) {
        this.leavingUntil = Date.now() + LEAVING_TIMEOUT;
      }
    };
    navigation?.addEventListener('navigate', onNavigate);

    inject(DestroyRef).onDestroy(() => {
      this.window.removeEventListener('popstate', listener);
      navigation?.removeEventListener('navigate', onNavigate);
    });
  }

  /**
   * Meldet ein geöffnetes Overlay an. `close` wird bei Zurück aufgerufen; die zurückgegebene Funktion
   * ruft das Overlay beim Schließen auf (mehrfacher Aufruf ist unschädlich).
   */
  register(close: () => void): () => void {
    const entry: OverlayEntry = { id: this.nextId++, close, released: false };
    this.whenIdle(() => this.push(entry));

    return () => {
      if (entry.released) {
        return;
      }
      entry.released = true;
      // erst nach den übrigen Abonnenten von afterClosed: startet einer davon eine Navigation oder ein
      // neues Overlay, liegt der Eintrag nicht mehr oben und bleibt stehen, statt mit ihm um die
      // Wette zu laufen (er wird beim nächsten Zurück übersprungen)
      setTimeout(() => this.whenIdle(() => this.removeReleased(false)));
    };
  }

  private push(entry: OverlayEntry): void {
    if (entry.released) {
      return;
    }
    const history = this.window.history;
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    history.pushState({ ...state, overlayBack: entry.id }, '');
    this.stack.push(entry);
  }

  /**
   * Entfernt freigegebene Einträge oben auf dem Stapel mit einem Schritt zurück, wenn der Browser
   * gerade auf dem obersten steht. Nach einem popstate (`afterPop`) läuft die Router-Navigation zur
   * selben URL bereits und hindert nicht.
   */
  private removeReleased(afterPop: boolean): void {
    const top = this.stack.at(-1);
    if (!top?.released || markerOf(this.window.history.state) !== top.id) {
      return;
    }
    if (!afterPop && (this.router.currentNavigation() || Date.now() < this.leavingUntil)) {
      return;
    }

    let count = 0;
    while (this.stack.at(-1)?.released) {
      this.stack.pop();
      count++;
    }
    this.traverse(-count);
  }

  private traverse(delta: number): void {
    this.ownTraversal = setTimeout(() => this.settle(), TRAVERSAL_TIMEOUT);
    if (delta === -1) {
      this.window.history.back();
    } else {
      this.window.history.go(delta);
    }
  }

  private onPopState(event: PopStateEvent): void {
    if (this.ownTraversal) {
      // popstate des eigenen history.back: schließt nichts
      this.settle();
      return;
    }

    const marker = markerOf(event.state);
    while (this.stack.length && this.stack.at(-1)!.id > marker) {
      const entry = this.stack.pop()!;
      if (!entry.released) {
        entry.close();
      }
    }

    // gelandet auf dem Eintrag eines schon geschlossenen Overlays: gleich weiter zurück
    this.removeReleased(true);
  }

  private settle(): void {
    if (this.ownTraversal) {
      clearTimeout(this.ownTraversal);
      this.ownTraversal = null;
    }
    while (!this.ownTraversal && this.pending.length) {
      this.pending.shift()!();
    }
  }

  private whenIdle(step: () => void): void {
    if (this.ownTraversal) {
      this.pending.push(step);
    } else {
      step();
    }
  }
}
