import { DestroyRef, Directive, ElementRef, NgZone, inject, input, output, signal } from '@angular/core';
import { ROW_SWIPE_MIN_DISTANCE, ROW_SWIPE_OPEN_WIDTH, evaluateRowSwipe, isSteep } from './row-swipe';

export type RowSwipeState = 'closed' | 'open-delete' | 'open-duplicate';
export type RowSwipeAction = 'delete' | 'duplicate';

/** Ab dieser Strecke entscheidet sich, ob die Geste waagrecht (Zeile) oder senkrecht (Scrollen) ist */
const DECIDE_DISTANCE = 10;

/** Höchstens eine Zeile der Liste ist offen; eine Geste auf einer anderen Zeile schließt sie */
let openRow: RowSwipeDirective | null = null;

/**
 * Wischaktionen einer Rechnungszeile (design.md §3.1, AC3): links Löschen, rechts Duplizieren.
 * Der Host enthält die verschiebbare Zeile (`.swipe-content`) und darunter die Aktionen; welche
 * Aktion aufgedeckt ist, steht in `data-swipe` (left/right). Touch Events passiv und außerhalb der
 * Zone wie beim Tab-Wischen; der Host trägt `data-no-swipe`, damit das Tab-Wischen ihn auslässt.
 */
@Directive({
  selector: '[appRowSwipe]',
  exportAs: 'rowSwipe'
})
export class RowSwipeDirective {
  /** Aktion ausgelöst: weit gewischt oder Tipp auf die aufgedeckte Aktion */
  readonly rowAction = output<RowSwipeAction>();
  readonly state = signal<RowSwipeState>('closed');
  /** false: links wischen deckt kein „Löschen“ auf (Rechnung eines verbundenen Kontos) */
  readonly deletable = input(true);

  private readonly zone = inject(NgZone);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private start: { x: number; y: number } | null = null;
  private direction: 'undecided' | 'horizontal' | 'vertical' = 'undecided';
  private baseOffset = 0;
  /** nach einer Wischgeste: der folgende Klick öffnet die Rechnung nicht */
  private suppressClick = false;

  constructor() {
    const listeners: [string, (event: TouchEvent) => void][] = [
      ['touchstart', event => this.onStart(event)],
      ['touchmove', event => this.onMove(event)],
      ['touchend', event => this.onEnd(event)],
      ['touchcancel', () => this.cancel()]
    ];
    const onClick = (event: MouseEvent) => this.onClick(event);

    // passiv und außerhalb der Zone: das Scrollen wartet nie auf die Geste
    this.zone.runOutsideAngular(() => {
      listeners.forEach(([type, fn]) => this.host.addEventListener(type, fn as EventListener, { passive: true }));
      this.host.addEventListener('click', onClick, { capture: true });
    });
    inject(DestroyRef).onDestroy(() => {
      listeners.forEach(([type, fn]) => this.host.removeEventListener(type, fn as EventListener));
      this.host.removeEventListener('click', onClick, { capture: true });
      if (openRow === this) {
        openRow = null;
      }
    });
  }

  /** Zeile schließen (Abbrechen der Rückfrage, Tipp auf die offene Zeile, Wischen woanders) */
  close(): void {
    this.state.set('closed');
    this.moveTo(0);
    if (openRow === this) {
      openRow = null;
    }
  }

  private onStart(event: TouchEvent): void {
    this.suppressClick = false;
    if (event.touches.length !== 1) {
      this.cancel();
      return;
    }

    if (openRow && openRow !== this) {
      const other = openRow;
      this.zone.run(() => other.close());
    }

    const touch = event.touches[0];
    this.start = { x: touch.clientX, y: touch.clientY };
    this.direction = 'undecided';
    this.baseOffset = this.offsetOf(this.state());
  }

  private onMove(event: TouchEvent): void {
    const start = this.start;
    if (!start) {
      return;
    }
    // zweiter Finger (Pinch): keine Wischgeste
    if (event.touches.length > 1) {
      this.cancel();
      return;
    }

    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (this.direction === 'undecided') {
      if (Math.hypot(dx, dy) < DECIDE_DISTANCE) {
        return;
      }
      this.direction = isSteep(dx, dy) ? 'vertical' : 'horizontal';
      if (this.direction === 'horizontal') {
        this.host.classList.add('dragging');
      }
    }

    if (this.direction === 'horizontal') {
      const width = this.host.getBoundingClientRect().width;
      const min = this.deletable() ? -width : 0;
      this.moveTo(Math.max(min, Math.min(width, this.baseOffset + dx)));
    }
  }

  private onEnd(event: TouchEvent): void {
    const start = this.start;
    const horizontal = this.direction === 'horizontal';
    this.start = null;
    this.direction = 'undecided';
    this.host.classList.remove('dragging');

    const touch = event.changedTouches[0];
    if (!start || !touch || !horizontal) {
      return;
    }

    this.suppressClick = true;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // offene Zeile zurückgewischt: schließen
    const closing = this.baseOffset !== 0 && Math.sign(dx) === -Math.sign(this.baseOffset)
      && Math.abs(dx) >= ROW_SWIPE_MIN_DISTANCE;
    let result = closing ? null : evaluateRowSwipe(this.baseOffset + dx, dy, this.host.getBoundingClientRect().width);
    if (!this.deletable() && (result === 'delete' || result === 'open-delete')) {
      result = null;
    }

    this.zone.run(() => {
      switch (result) {
        case 'delete':
          this.open('open-delete');
          this.rowAction.emit('delete');
          break;
        case 'duplicate':
          this.close();
          this.rowAction.emit('duplicate');
          break;
        case 'open-delete':
        case 'open-duplicate':
          this.open(result);
          break;
        default:
          this.close();
      }
    });
  }

  private onClick(event: MouseEvent): void {
    // Tipp auf die aufgedeckte Aktion: deren eigener Klick-Handler
    if ((event.target as Element | null)?.closest('.under')) {
      this.suppressClick = false;
      return;
    }
    if (this.suppressClick || this.state() !== 'closed') {
      // kein Öffnen der Rechnung nach einer Wischgeste bzw. beim Tipp auf die offene Zeile
      event.preventDefault();
      event.stopPropagation();
      this.suppressClick = false;
      if (this.state() !== 'closed') {
        this.zone.run(() => this.close());
      }
    }
  }

  private cancel(): void {
    if (this.start && this.direction === 'horizontal') {
      this.moveTo(this.baseOffset);
    }
    this.start = null;
    this.direction = 'undecided';
    this.host.classList.remove('dragging');
  }

  private open(state: Exclude<RowSwipeState, 'closed'>): void {
    if (openRow && openRow !== this) {
      openRow.close();
    }
    openRow = this;
    this.state.set(state);
    this.moveTo(this.offsetOf(state));
  }

  private offsetOf(state: RowSwipeState): number {
    switch (state) {
      case 'open-delete': return -ROW_SWIPE_OPEN_WIDTH;
      case 'open-duplicate': return ROW_SWIPE_OPEN_WIDTH;
      default: return 0;
    }
  }

  private moveTo(offset: number): void {
    const content = this.host.querySelector<HTMLElement>('.swipe-content');
    if (content) {
      content.style.transform = offset === 0 ? '' : `translateX(${offset}px)`;
    }
    // Seite der aufgedeckten Aktion; beim Schließen bleibt sie, bis die Zeile wieder deckt
    if (offset !== 0) {
      this.host.dataset['swipe'] = offset < 0 ? 'left' : 'right';
    }
  }
}
