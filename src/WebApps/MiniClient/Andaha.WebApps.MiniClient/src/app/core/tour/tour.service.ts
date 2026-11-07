import { effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { map } from 'rxjs';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { QuickEntryHandle, QuickEntryService } from 'src/app/features/bill/quick-entry/quick-entry.service';
import { TourSeenStore } from './tour-seen-store';
import { tourSteps } from './tour-steps';

/** Komponente der Tour-Ansicht; die echte liefert die Tour-Overlay-Komponente */
export const TOUR_OVERLAY_COMPONENT = new InjectionToken<ComponentType<unknown>>('TOUR_OVERLAY_COMPONENT');

const DESKTOP = '(min-width: 1024px)';
/** Wartezeit, bis die Tour nach erfüllten Bedingungen automatisch startet */
const START_DELAY = 400;
/** Über Sheets und Dialogen (CDK-Overlay-Container: 1000) */
const TOUR_Z_INDEX = '1001';
const LAST_STEP = 2;

/**
 * Schnellhilfe-Tour: startet einmal pro Gerät automatisch, sobald die Rechnungsliste bereit ist und
 * kein Overlay offen ist, und auf Wunsch jederzeit (`request`). Die Darstellung übernimmt die
 * Tour-Overlay-Komponente, die den Zustand aus diesem Service liest.
 */
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

  readonly active = this.activeState.asReadonly();
  readonly stepIndex = this.step.asReadonly();
  readonly desktop = toSignal(
    inject(BreakpointObserver).observe(DESKTOP).pipe(map(state => state.matches)),
    { initialValue: inject(BreakpointObserver).isMatched(DESKTOP) }
  );

  private overlayRef: OverlayRef | null = null;
  private releaseBack: (() => void) | null = null;
  private preview: QuickEntryHandle | null = null;

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
  }

  /** Manueller Start: ignoriert das Gesehen-Flag, wartet aber auf dieselbe Bereitschaft */
  request(): void {
    this.requested.set(true);
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
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.releaseBack?.();
    this.releaseBack = null;
    this.activeState.set(false);
  }

  private shouldStart(): boolean {
    return this.listReady() && this.overlayBack.openCount() === 0 && !this.activeState()
      && (this.requested() || !this.seenStore.isSeenOrUnavailable());
  }

  private start(): void {
    this.seenStore.markSeen();
    this.requested.set(false);
    this.step.set(0);
    this.activeState.set(true);
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
  }

  private goTo(index: number): void {
    this.closePreview();
    this.step.set(index);
    if (tourSteps({ desktop: this.desktop(), hasTiles: false })[index].opensQuickEntry) {
      this.openPreview();
    }
  }

  private openPreview(): void {
    const handle = this.quickEntry.open({ preview: true });
    if (!handle) {
      return;
    }
    this.preview = handle;
    // zuerst abonnieren: ein später Abonnent einer schon geschlossenen Vorschau bekäme nichts mehr
    handle.closed$.subscribe(() => {
      if (this.preview === handle) {
        this.preview = null;
        this.end();
      }
    });
    this.bringToFront();
  }

  /** Schließt die Vorschau, ohne dass deren `closed$` die Tour beendet */
  private closePreview(): void {
    const handle = this.preview;
    this.preview = null;
    handle?.close();
  }

  /** Die frisch geöffnete Vorschau liegt sonst über der Tour (gleiche Ebene, später im DOM) */
  private bringToFront(): void {
    const host = this.overlayRef?.hostElement;
    host?.parentElement?.appendChild(host);
    // Die App schaltet Popover ab (usePopover: false); für den Fall, dass doch eins aktiv ist
    if (host?.hasAttribute('popover')) {
      try {
        host.hidePopover();
        host.showPopover();
      } catch {
        // Popover nicht verfügbar
      }
    }
  }
}
