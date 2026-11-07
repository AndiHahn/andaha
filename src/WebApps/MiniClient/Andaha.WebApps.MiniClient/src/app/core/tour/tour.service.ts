import { effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { map } from 'rxjs';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { QuickEntryHandle, QuickEntryService } from 'src/app/features/bill/quick-entry/quick-entry.service';
import { TourOverlayComponent } from './tour-overlay/tour-overlay.component';
import { TourSeenStore } from './tour-seen-store';
import { tourSteps } from './tour-steps';

/**
 * Komponente der Tour-Ansicht, in Tests austauschbar. Der Import der Komponente ist zirkulär
 * (sie injiziert diesen Service), beide Seiten greifen aber erst zur Laufzeit darauf zu.
 */
export const TOUR_OVERLAY_COMPONENT = new InjectionToken<ComponentType<unknown>>('TOUR_OVERLAY_COMPONENT', {
  providedIn: 'root',
  factory: () => TourOverlayComponent
});

const DESKTOP = '(min-width: 1024px)';
/** Wartezeit, bis die Tour nach erfüllten Bedingungen automatisch startet */
const START_DELAY = 400;
/** Über Sheets und Dialogen (CDK-Overlay-Container: 1000); die App schaltet Popover ab (usePopover: false) */
const TOUR_Z_INDEX = '1001';
const LAST_STEP = 2;

/**
 * Schnellhilfe-Tour: startet einmal pro Gerät automatisch, sobald die Rechnungsliste bereit ist und
 * kein Overlay offen ist, und auf Wunsch jederzeit (`request`). Die Darstellung übernimmt die
 * Tour-Overlay-Komponente, die den Zustand aus diesem Service liest.
 */
/** Normaler Linksklick ohne Zusatztaste; Strg-/Mittelklick öffnet den Link woanders, dort soll keine Tour starten */
export function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly overlay = inject(Overlay);
  private readonly overlayBack = inject(OverlayBackService);
  private readonly quickEntry = inject(QuickEntryService);
  private readonly overlayComponent = inject(TOUR_OVERLAY_COMPONENT);
  private readonly seenStore = new TourSeenStore(() => localStorage);

  private readonly activeState = signal(false);
  private readonly step = signal(0);
  private readonly listReady = signal(false);
  private readonly requested = signal(false);
  /** In dieser App-Sitzung schon automatisch gezeigt (falls das Speichern des Flags scheitert) */
  private autoShown = false;

  readonly active = this.activeState.asReadonly();
  readonly stepIndex = this.step.asReadonly();
  readonly desktop = toSignal(
    inject(BreakpointObserver).observe(DESKTOP).pipe(map(state => state.matches)),
    { initialValue: inject(BreakpointObserver).isMatched(DESKTOP) }
  );

  private overlayRef: OverlayRef | null = null;
  private releaseBack: (() => void) | null = null;
  private preview: QuickEntryHandle | null = null;
  /** Vorschau wollte öffnen, die Schnellerfassung war aber noch belegt */
  private previewPending = false;

  constructor() {
    effect(onCleanup => {
      if (!this.shouldStart()) {
        return;
      }
      const timer = setTimeout(() => {
        if (this.shouldStart()) {
          this.start();
        }
      }, START_DELAY);
      onCleanup(() => clearTimeout(timer));
    });
  }

  /** Bill-Liste: erstes Laden fertig und Start-Absicht verarbeitet; `false` beim Zerstören */
  setListReady(ready: boolean): void {
    this.listReady.set(ready);
    // Liste weg (z. B. Seitenwechsel): eine laufende Tour hätte keine Ziele mehr
    if (!ready) {
      this.end();
    }
  }

  /** Manueller Start: ignoriert das Gesehen-Flag, wartet aber auf dieselbe Bereitschaft */
  request(): void {
    if (!this.activeState()) {
      this.requested.set(true);
    }
  }

  next(): void {
    if (!this.activeState()) {
      return;
    }
    if (this.step() >= LAST_STEP) {
      this.end();
      return;
    }
    this.goTo(this.step() + 1);
  }

  back(): void {
    if (this.activeState() && this.step() > 0) {
      this.goTo(this.step() - 1);
    }
  }

  /** Beenden (Fertig, Überspringen, Escape, Zurück); mehrfaches Aufrufen ist unschädlich */
  end(): void {
    if (!this.activeState()) {
      return;
    }
    this.closePreview();
    this.previewPending = false;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.releaseBack?.();
    this.releaseBack = null;
    this.activeState.set(false);
  }

  private shouldStart(): boolean {
    return this.listReady() && this.overlayBack.openCount() === 0 && !this.activeState()
      && (this.requested() || (!this.autoShown && !this.seenStore.isSeenOrUnavailable()));
  }

  private start(): void {
    this.seenStore.markSeen();
    this.autoShown = true;
    this.requested.set(false);
    this.step.set(0);
    this.activeState.set(true);
    try {
      this.releaseBack = this.overlayBack.register(() => this.end());
      this.overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().top('0').left('0'),
        width: '100%',
        height: '100%',
        hasBackdrop: false,
        disposeOnNavigation: false
      });
      this.overlayRef.hostElement.style.zIndex = TOUR_Z_INDEX;
      this.overlayRef.attach(new ComponentPortal(this.overlayComponent));
    } catch (error) {
      this.end();
      throw error;
    }
  }

  private goTo(index: number): void {
    this.closePreview();
    this.previewPending = false;
    this.step.set(index);
    if (this.opensPreview(index)) {
      this.openPreview();
    }
  }

  private opensPreview(index: number): boolean {
    return tourSteps({ desktop: this.desktop(), hasTiles: false })[index].opensQuickEntry;
  }

  private openPreview(): void {
    const handle = this.quickEntry.open({ preview: true });
    if (!handle) {
      // die vorige Vorschau schließt noch (schnell Zurück→Weiter): nach ihrem Schließen erneut versuchen
      this.previewPending = true;
      return;
    }
    this.previewPending = false;
    this.preview = handle;
    // zuerst abonnieren: ein später Abonnent einer schon geschlossenen Vorschau bekäme nichts mehr
    handle.closed$.subscribe(() => {
      if (this.preview === handle) {
        this.preview = null;
        this.end();
        return;
      }
      // von der Tour geschlossen; die Schnellerfassung ist jetzt wieder frei
      if (this.previewPending && this.activeState() && this.opensPreview(this.step())) {
        this.openPreview();
      }
    });
  }

  /** Schließt die Vorschau, ohne dass deren `closed$` die Tour beendet */
  private closePreview(): void {
    const handle = this.preview;
    this.preview = null;
    handle?.close();
  }
}
