import { DestroyRef, Directive, ElementRef, NgZone, effect, inject, input, output } from '@angular/core';

/** Zugstrecke (nach Dämpfung), ab der losgelassen neu geladen wird */
export const PULL_THRESHOLD = 60;
/** Weiter zieht der Indikator nicht mit */
const PULL_MAX = 96;
/** Der Finger bewegt den Indikator nur halb so weit (Widerstand) */
const PULL_RESISTANCE = 0.5;
/** Ab dieser Strecke gilt die Geste als Ziehen */
const PULL_START = 8;
/** Ruheposition des Indikators beim Laden */
const PULL_REST = 48;
/** Der Indikator dreht mindestens so lange, auch wenn die Antwort schneller kommt */
const MIN_SPIN_MS = 600;

/**
 * Pull-to-Refresh für einen Scroll-Container (design.md §3.1, AC4). Beginnt nur bei `scrollTop` 0
 * und nur bei einer Bewegung nach unten, die steiler als waagrecht ist. Der runde Indikator
 * (Mockup 01 C) ist ein eigenes Element außerhalb des Containers; die Direktive setzt seine
 * Position (`--ptr-y`, `--ptr-turn`) und die Klassen `pulling`/`spinning` direkt am DOM, damit
 * die Geste keine Change Detection auslöst. Touch Events passiv, wie beim Tab-Wischen.
 */
@Directive({
  selector: '[appPullToRefresh]'
})
export class PullToRefreshDirective {
  readonly indicator = input.required<HTMLElement>({ alias: 'appPullToRefresh' });
  /** true, solange das Neuladen läuft; danach verschwindet der Indikator */
  readonly refreshing = input(false);
  readonly refresh = output<void>();

  private readonly zone = inject(NgZone);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private start: { x: number; y: number } | null = null;
  private pulling = false;
  private distance = 0;
  private spinning = false;
  private spinStartedAt = 0;
  private spinTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const listeners: [string, (event: TouchEvent) => void][] = [
      ['touchstart', event => this.onStart(event)],
      ['touchmove', event => this.onMove(event)],
      ['touchend', () => this.onEnd()],
      ['touchcancel', () => this.reset()]
    ];
    this.zone.runOutsideAngular(() =>
      listeners.forEach(([type, fn]) => this.host.addEventListener(type, fn as EventListener, { passive: true })));
    inject(DestroyRef).onDestroy(() => {
      listeners.forEach(([type, fn]) => this.host.removeEventListener(type, fn as EventListener));
      clearTimeout(this.spinTimer);
    });

    effect(() => {
      if (!this.refreshing()) {
        this.finishIfIdle();
      }
    });
  }

  private onStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.start = event.touches.length === 1 && this.host.scrollTop <= 0 && !this.spinning
      ? { x: touch.clientX, y: touch.clientY }
      : null;
    this.pulling = false;
  }

  private onMove(event: TouchEvent): void {
    const start = this.start;
    if (!start) {
      return;
    }
    if (event.touches.length > 1) {
      this.reset();
      return;
    }

    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (!this.pulling) {
      if (Math.hypot(dx, dy) < PULL_START) {
        return;
      }
      // nur nach unten und eher senkrecht; sonst scrollt bzw. wischt der Nutzer
      if (dy <= 0 || Math.abs(dx) >= Math.abs(dy) || this.host.scrollTop > 0) {
        this.start = null;
        return;
      }
      this.pulling = true;
      this.indicator().classList.add('pulling');
    }

    this.distance = Math.max(0, Math.min(PULL_MAX, dy * PULL_RESISTANCE));
    this.render(this.distance);
  }

  private onEnd(): void {
    const pulled = this.pulling && this.distance >= PULL_THRESHOLD;
    this.start = null;
    this.pulling = false;

    if (pulled) {
      this.zone.run(() => this.startRefresh());
    } else if (!this.spinning) {
      this.reset();
    }
  }

  private startRefresh(): void {
    const indicator = this.indicator();
    this.spinning = true;
    this.spinStartedAt = Date.now();
    indicator.classList.remove('pulling');
    indicator.classList.add('spinning');
    this.render(PULL_REST);
    this.refresh.emit();

    clearTimeout(this.spinTimer);
    this.spinTimer = setTimeout(() => this.finishIfIdle(), MIN_SPIN_MS);
  }

  private finishIfIdle(): void {
    if (!this.spinning || this.refreshing() || Date.now() - this.spinStartedAt < MIN_SPIN_MS) {
      return;
    }
    this.spinning = false;
    this.reset();
  }

  private reset(): void {
    this.start = null;
    this.pulling = false;
    this.distance = 0;
    if (this.spinning) {
      return;
    }
    const indicator = this.indicator();
    indicator.classList.remove('pulling', 'spinning');
    indicator.style.removeProperty('--ptr-y');
    indicator.style.removeProperty('--ptr-turn');
  }

  private render(distance: number): void {
    const indicator = this.indicator();
    indicator.style.setProperty('--ptr-y', `${distance}px`);
    indicator.style.setProperty('--ptr-turn', `${Math.min(1, distance / PULL_THRESHOLD) * 270}deg`);
  }
}
