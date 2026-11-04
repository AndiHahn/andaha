import { DOCUMENT, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { OverlayBackService } from '../overlay/overlay-back.service';

/** Schlüssel in `history.state`: URLs der Router-Einträge unter dem Eintrag, nächster zuerst */
export const TRAIL_KEY = 'appTrail';
/** So viele Vorgänger werden mitgeführt */
const MAX_TRAIL = 5;

export function trailOf(state: unknown): string[] {
  const value = (state as Record<string, unknown> | null)?.[TRAIL_KEY];
  return Array.isArray(value) ? value.filter((url): url is string => typeof url === 'string') : [];
}

/** Pfad ohne Query und Fragment */
function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

interface PendingNavigation {
  id: number;
  replace: boolean;
  /** Spur des Eintrags, von dem die Navigation ausgeht */
  trail: string[];
  /** URL beim Start der Navigation (null vor der ersten) */
  from: string | null;
}

/**
 * Merkt sich zu jedem Router-Eintrag der Session-History, welche URLs darunter liegen
 * (`history.state.appTrail`, übersteht Neuladen), und verlässt Seiten danach so, dass Zurück nie auf
 * einen gelöschten Eintrag oder doppelt auf die Liste führt (I1/I2, design.md §9 „Zurück-Regeln“):
 * `leaveTo(liste)` geht in der History zurück, wenn die Liste direkt darunter liegt, sonst ersetzt die
 * Liste den aktuellen Eintrag.
 *
 * Die Spur wird nur bei eigenen (imperativen) Navigationen geschrieben: push → [vorige URL, ...Spur des
 * vorigen Eintrags], replace (replaceUrl, gleiche URL, erste Navigation) → Spur des ersetzten Eintrags.
 * Bei Zurück/Vor stellt der Browser den Zustand samt Spur wieder her; Overlay-Einträge
 * (OverlayBackService) kopieren den Zustand ihres Router-Eintrags und tragen damit dieselbe Spur.
 */
@Injectable({ providedIn: 'root' })
export class HistoryTrailService {
  private readonly router = inject(Router);
  private readonly overlayBack = inject(OverlayBackService);
  private readonly window = inject(DOCUMENT).defaultView!;

  private currentUrl: string | null = null;
  private pending: PendingNavigation | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.onStart(event);
      } else if (event instanceof NavigationEnd) {
        this.onEnd(event);
      }
    });
  }

  /** URLs der Router-Einträge unter dem aktuellen, nächster zuerst (leer, wenn unbekannt) */
  previousUrls(): string[] {
    return trailOf(this.window.history.state);
  }

  /**
   * Seite verlassen zur Liste `url`: Liegt sie unter den nächsten `depth` Router-Einträgen, geht es
   * dorthin zurück (die Einträge dazwischen bleiben als Vorwärts-Einträge), sonst ersetzt `url` den
   * aktuellen Eintrag. So bleibt genau ein Listen-Eintrag und kein Eintrag einer gelöschten Seite
   * unter der Liste.
   */
  leaveTo(url: string, depth = 1): void {
    const target = pathOf(url);
    const index = this.previousUrls().slice(0, depth).findIndex(previous => pathOf(previous) === target);
    if (index >= 0) {
      // wartet gerade geschlossene Overlays (Rückfrage-Dialog) ab
      this.overlayBack.back(index + 1);
    } else {
      // erst nach dem Entfernen des Overlay-Eintrags, sonst ersetzte die Navigation ihn
      this.overlayBack.afterPendingSteps(() => void this.router.navigateByUrl(url, { replaceUrl: true }));
    }
  }

  private onStart(event: NavigationStart): void {
    const extras = this.router.currentNavigation()?.extras;
    this.pending = event.navigationTrigger === 'imperative' && !extras?.skipLocationChange
      ? { id: event.id, replace: !!extras?.replaceUrl, trail: this.previousUrls(), from: this.currentUrl }
      : null;
  }

  private onEnd(event: NavigationEnd): void {
    const pending = this.pending?.id === event.id ? this.pending : null;
    this.pending = null;
    this.currentUrl = event.urlAfterRedirects;
    if (!pending) {
      return;
    }
    // wie der Router (HistoryStateManager.setBrowserUrl): gleiche URL wird ersetzt statt gepusht
    const pushed = !pending.replace && pending.from !== null && pending.from !== event.urlAfterRedirects;
    const trail = pushed ? [pending.from!, ...pending.trail].slice(0, MAX_TRAIL) : pending.trail;
    const state = this.window.history.state && typeof this.window.history.state === 'object' ? this.window.history.state : {};
    this.window.history.replaceState({ ...state, [TRAIL_KEY]: trail }, '');
  }
}
