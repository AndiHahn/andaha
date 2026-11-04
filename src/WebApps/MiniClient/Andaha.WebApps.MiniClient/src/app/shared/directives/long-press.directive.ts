import { DestroyRef, Directive, ElementRef, EventEmitter, NgZone, Output, inject } from '@angular/core';

/** So lange halten, bis der lange Druck auslöst (ms) */
const HOLD_MS = 500;
/** Weiter bewegt (px) gilt als Scrollen oder Wischen, nicht als langer Druck */
const MAX_MOVE = 10;
/** Folgt dem langen Druck ein contextmenu des Browsers (Android), zählt es nicht noch einmal */
const DUPLICATE_WINDOW_MS = 800;

/**
 * Langer Druck (500 ms ohne Bewegung > 10 px) oder Kontextmenü (Rechtsklick, Menütaste) löst
 * `longPress` aus. Der Klick, der einen langen Druck beendet, wird verschluckt.
 */
@Directive({
  selector: '[appLongPress]',
  host: { 'style': '-webkit-touch-callout: none' }
})
export class LongPressDirective {
  @Output() readonly longPress = new EventEmitter<Event>();

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  private press: { pointerId: number; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;
  private lastFired = Number.NEGATIVE_INFINITY;
  private swallowClick = false;

  constructor() {
    const listeners: [string, (event: Event) => void, boolean][] = [
      ['pointerdown', event => this.onDown(event as PointerEvent), false],
      ['pointermove', event => this.onMove(event as PointerEvent), false],
      ['pointerup', () => this.cancel(), false],
      ['pointercancel', () => this.cancel(), false],
      ['pointerleave', () => this.cancel(), false],
      ['contextmenu', event => this.onContextMenu(event), false],
      // Capture-Phase: vor den (click)-Bindungen am Element selbst
      ['click', event => this.onClick(event), true]
    ];
    this.zone.runOutsideAngular(() =>
      listeners.forEach(([type, fn, capture]) => this.host.addEventListener(type, fn, capture)));
    inject(DestroyRef).onDestroy(() => {
      this.cancel();
      listeners.forEach(([type, fn, capture]) => this.host.removeEventListener(type, fn, capture));
    });
  }

  private onDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.cancel();
    this.swallowClick = false;
    const timer = setTimeout(() => {
      this.press = null;
      this.swallowClick = true;
      this.fire(event);
    }, HOLD_MS);
    this.press = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer };
  }

  private onMove(event: PointerEvent): void {
    const press = this.press;
    if (press && event.pointerId === press.pointerId
      && Math.hypot(event.clientX - press.x, event.clientY - press.y) > MAX_MOVE) {
      this.cancel();
    }
  }

  private onContextMenu(event: Event): void {
    event.preventDefault();
    this.cancel();
    if (Date.now() - this.lastFired > DUPLICATE_WINDOW_MS) {
      this.fire(event);
    }
  }

  private onClick(event: Event): void {
    if (this.swallowClick) {
      this.swallowClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private fire(event: Event): void {
    this.lastFired = Date.now();
    this.zone.run(() => this.longPress.emit(event));
  }

  private cancel(): void {
    if (this.press) {
      clearTimeout(this.press.timer);
      this.press = null;
    }
  }
}
