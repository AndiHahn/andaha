import { DestroyRef, Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialogRef } from '@angular/material/dialog';

/** Ab diesem Weg nach unten (px) schließt das Sheet beim Loslassen */
const DISMISS_DISTANCE = 80;
/** Ab dieser Geschwindigkeit nach unten (px/ms) schließt das Sheet auch bei kurzem Weg */
const DISMISS_VELOCITY = 0.5;
const SPRING_BACK = 'transform 200ms ease-out';

/** Loslassen nach `dy` px nach unten mit `velocity` px/ms: schließen (true) oder zurückfedern. */
export function shouldDismissSheet(dy: number, velocity: number): boolean {
  return dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY;
}

/** Bottom Sheet (SheetService) oder Dialog, der mobil als Sheet erscheint (getDialogBaseConfig) */
export type SheetDragRef = MatBottomSheetRef<unknown, unknown> | MatDialogRef<unknown, unknown>;

/**
 * Am Griff eines Sheets (AC6, v2 „Griff ist funktional“): Ziehen nach unten verschiebt das Panel,
 * Loslassen nach > 80 px oder mit > 0,5 px/ms schließt es, sonst federt es zurück.
 */
@Directive({
  selector: '[appSheetDrag]',
  host: { 'style': 'touch-action: none' }
})
export class SheetDragDirective {
  @Input({ required: true }) appSheetDrag!: SheetDragRef;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  private drag: { pointerId: number; startY: number; dy: number; lastY: number; lastTime: number; velocity: number; panel: HTMLElement } | null = null;

  constructor() {
    const listeners: [string, (event: PointerEvent) => void][] = [
      ['pointerdown', event => this.onDown(event)],
      ['pointermove', event => this.onMove(event)],
      ['pointerup', event => this.onUp(event)],
      ['pointercancel', event => this.onCancel(event)]
    ];
    this.zone.runOutsideAngular(() => listeners.forEach(([type, fn]) => this.host.addEventListener(type, fn as EventListener)));
    inject(DestroyRef).onDestroy(() => listeners.forEach(([type, fn]) => this.host.removeEventListener(type, fn as EventListener)));
  }

  private onDown(event: PointerEvent): void {
    const panel = this.host.closest<HTMLElement>('.cdk-overlay-pane');
    if (this.drag || !panel || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }
    this.host.setPointerCapture(event.pointerId);
    panel.style.transition = 'none';
    this.drag = { pointerId: event.pointerId, startY: event.clientY, dy: 0, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, panel };
  }

  private onMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) {
      drag.velocity = (event.clientY - drag.lastY) / elapsed;
    }
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
    drag.dy = Math.max(0, event.clientY - drag.startY);
    drag.panel.style.transform = `translateY(${drag.dy}px)`;
  }

  private onUp(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    this.drag = null;
    if (shouldDismissSheet(drag.dy, drag.velocity)) {
      // Panel bleibt verschoben stehen, die Schließen-Animation blendet es von dort aus
      this.zone.run(() => this.close());
    } else {
      this.springBack(drag.panel);
    }
  }

  private onCancel(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) {
      this.springBack(this.drag.panel);
      this.drag = null;
    }
  }

  private springBack(panel: HTMLElement): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.style.transition = reduceMotion ? 'none' : SPRING_BACK;
    panel.style.transform = '';
  }

  private close(): void {
    const ref = this.appSheetDrag;
    if (ref instanceof MatBottomSheetRef) {
      ref.dismiss();
    } else {
      ref.close();
    }
  }
}
