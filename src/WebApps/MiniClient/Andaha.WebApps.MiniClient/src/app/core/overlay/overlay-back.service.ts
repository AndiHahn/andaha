import { DestroyRef, DOCUMENT, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

interface OverlayEntry {
  id: number;
  /** Kennung des Router-Eintrags, über dem das Overlay liegt (`history.state.overlayBase`) */
  base: number;
  close: () => void;
  released: boolean;
}

/** Stelle eines History-Eintrags: Router-Eintrag (`base`, null = nie markiert) und Overlay (`marker`, 0 = keins) */
interface HistoryPosition {
  base: number | null;
  marker: number;
}

/** Wartezeit auf das popstate eines eigenen history.back, falls der Browser keins schickt */
const TRAVERSAL_TIMEOUT = 1000;
/** So lange nach dem Start einer Navigation weg von der App kein history.back */
const LEAVING_TIMEOUT = 5000;

function numberOf(state: unknown, key: 'overlayBase' | 'overlayBack'): number | null {
  const value = (state as Record<string, unknown> | null)?.[key];
  return typeof value === 'number' ? value : null;
}

function positionOf(state: unknown): HistoryPosition {
  return { base: numberOf(state, 'overlayBase'), marker: numberOf(state, 'overlayBack') ?? 0 };
}

/**
 * Zurück-Taste und Zurück-Geste schließen zuerst ein offenes Sheet, einen Dialog oder ein Menü (AC6).
 *
 * Jedes Overlay bekommt einen History-Eintrag mit gleicher URL und `history.state.overlayBack = <id>`.
 * Der Router-Eintrag darunter wird beim ersten Overlay mit `overlayBase = <id>` markiert (replaceState),
 * die Overlay-Einträge erben die Markierung. So ist jede Stelle der History als (base, marker)
 * geordnet, auch wenn der Router zwischendurch eigene Einträge angelegt hat.
 *
 * - popstate: alle Overlays hinter der erreichten Stelle schließen, oberstes zuerst. Ist die Stelle
 *   der Eintrag eines schon geschlossenen oder unbekannten Overlays (z. B. unter einer Navigation
 *   liegen geblieben, oder aus einer früheren Sitzung), gleich einen Schritt weiter zurück: kein
 *   Zurück-Druck bleibt wirkungslos.
 * - Overlay anders geschlossen: `history.back()` entfernt seinen Eintrag, sofern er noch oben liegt;
 *   zusammen mit direkt darunter liegenden geschlossenen Overlays desselben Router-Eintrags, nie
 *   über einen Router-Eintrag hinweg. Das popstate dieses eigenen Schritts schließt nichts.
 *
 * Der Router sieht diese popstate-Ereignisse nur als Navigation auf dieselbe URL und überspringt sie;
 * Dialoge und Sheets schließen nicht selbst bei popstate (`closeOnNavigation: false`).
 * Ids steigen über Neuladen hinweg (Zeitbasis).
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
    // zusätzlich zu leaveDocument(): Navigation API, wo vorhanden (navigate kommt synchron beim Start)
    const navigation: Navigation | undefined = (this.window as Window & { navigation?: Navigation }).navigation;
    const onNavigate = (event: NavigateEvent) => {
      if (!event.destination.sameDocument) {
        this.leavingUntil = Math.max(this.leavingUntil, Date.now() + LEAVING_TIMEOUT);
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
    const entry: OverlayEntry = { id: this.nextId++, base: 0, close, released: false };
    this.whenIdle(() => this.push(entry));

    return () => {
      if (entry.released) {
        return;
      }
      entry.released = true;
      // erst nach den übrigen Abonnenten von afterClosed: startet einer davon eine Navigation oder ein
      // neues Overlay, liegt der Eintrag nicht mehr oben und bleibt stehen, statt mit ihm um die
      // Wette zu laufen (er wird beim nächsten Zurück übersprungen)
      setTimeout(() => this.whenIdle(() => this.removeReleasedOnTop()));
    };
  }

  /**
   * Vor einer Navigation weg von der App (Ausloggen): ab jetzt kein history.back mehr, es könnte die
   * laufende Navigation abbrechen. Unabhängig von der Navigation API.
   */
  leaveDocument(): void {
    this.leavingUntil = Number.POSITIVE_INFINITY;
  }

  private push(entry: OverlayEntry): void {
    if (entry.released) {
      return;
    }
    const history = this.window.history;
    let state: Record<string, unknown> = history.state && typeof history.state === 'object' ? history.state : {};
    let base = numberOf(state, 'overlayBase');
    if (base === null) {
      base = this.nextId++;
      state = { ...state, overlayBase: base };
      history.replaceState(state, '');
    }
    entry.base = base;
    history.pushState({ ...state, overlayBack: entry.id }, '');
    this.stack.push(entry);
  }

  /** Programmatisch geschlossen: freigegebene Einträge oben entfernen, wenn der Browser dort steht. */
  private removeReleasedOnTop(): void {
    const top = this.stack.at(-1);
    if (!top?.released || numberOf(this.window.history.state, 'overlayBack') !== top.id) {
      return;
    }
    if (this.router.currentNavigation() || Date.now() < this.leavingUntil) {
      return;
    }
    this.traverse(-this.popReleasedRun());
  }

  /** Nimmt die freigegebenen Einträge oben vom Stapel, die über demselben Router-Eintrag liegen. */
  private popReleasedRun(): number {
    const base = this.stack.at(-1)?.base;
    let count = 0;
    while (this.stack.at(-1)?.released && this.stack.at(-1)!.base === base) {
      this.stack.pop();
      count++;
    }
    return count;
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

    const landed = positionOf(event.state);
    while (this.stack.length && isAfter(this.stack.at(-1)!, landed)) {
      const entry = this.stack.pop()!;
      if (!entry.released) {
        entry.close();
      }
    }

    if (landed.marker === 0 || Date.now() < this.leavingUntil) {
      return;
    }
    // gelandet auf einem Overlay-Eintrag: offen → bleiben; geschlossen oder unbekannt → weiter zurück
    const top = this.stack.at(-1);
    if (top?.id === landed.marker) {
      if (top.released) {
        this.traverse(-this.popReleasedRun());
      }
    } else {
      this.traverse(-1);
    }
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

/** Liegt der Overlay-Eintrag in der History hinter der erreichten Stelle? Unmarkierter Router-Eintrag: alles. */
function isAfter(entry: OverlayEntry, landed: HistoryPosition): boolean {
  if (landed.base === null) {
    return true;
  }
  return entry.base > landed.base || (entry.base === landed.base && entry.id > landed.marker);
}
