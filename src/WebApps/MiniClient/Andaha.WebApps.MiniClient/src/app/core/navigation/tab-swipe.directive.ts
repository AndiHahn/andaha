import { DestroyRef, Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { findTabIndex, isTabPage, NavArea } from './nav-areas';
import { evaluateSwipe, isSwipeExcluded, SwipePoint } from './swipe';

/** Richtung eines Tab-Wechsels, als `NavigationBehaviorOptions.info` an die View Transition */
export interface TabNavigationInfo {
  tabDirection: 'next' | 'prev';
}

/**
 * Am Inhaltscontainer eines Bereichs: Wischen nach links/rechts wechselt zum Nachbar-Tab (AC4).
 * Nur auf den Tab-Seiten selbst (wie die Tabs), am ersten/letzten Tab ohne Umlauf.
 *
 * Touch Events statt Pointer Events: ein touchend kommt auch dann, wenn der Browser die Geste
 * zum Scrollen übernommen hat; Pointer Events brächen dort mit pointercancel ab, und ein
 * `touch-action: pan-y` am Container nähme den Chip-Streifen das waagrechte Scrollen.
 * Overlays (Sheets, Dialoge, Menüs) liegen im Overlay-Container außerhalb und lösen nie aus.
 */
@Directive({
  selector: '[appTabSwipe]'
})
export class TabSwipeDirective {
  @Input({ required: true }) appTabSwipe!: NavArea;

  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private start: SwipePoint | null = null;

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const listeners: [string, (event: TouchEvent) => void][] = [
      ['touchstart', event => this.onStart(event)],
      ['touchmove', event => this.onMove(event)],
      ['touchend', event => this.onEnd(event)],
      ['touchcancel', () => this.start = null]
    ];
    // passiv und außerhalb der Zone: das Scrollen wartet nie auf die Geste
    this.zone.runOutsideAngular(() =>
      listeners.forEach(([type, fn]) => host.addEventListener(type, fn as EventListener, { passive: true })));
    inject(DestroyRef).onDestroy(() => listeners.forEach(([type, fn]) => host.removeEventListener(type, fn as EventListener)));
  }

  private onStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.start = event.touches.length === 1 && !isSwipeExcluded(event.target as Element | null)
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  }

  private onMove(event: TouchEvent): void {
    // zweiter Finger (Pinch): keine Wischgeste
    if (event.touches.length > 1) {
      this.start = null;
    }
  }

  private onEnd(event: TouchEvent): void {
    const start = this.start;
    this.start = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || event.touches.length > 0) {
      return;
    }

    const direction = evaluateSwipe(start, { x: touch.clientX, y: touch.clientY }, window.innerWidth);
    if (direction) {
      this.zone.run(() => this.navigate(direction));
    }
  }

  private navigate(direction: TabNavigationInfo['tabDirection']): void {
    const area = this.appTabSwipe;
    const url = this.router.url;
    if (!isTabPage(area, url)) {
      return;
    }

    const target = area.tabs[findTabIndex(area, url) + (direction === 'next' ? 1 : -1)];
    if (target) {
      const info: TabNavigationInfo = { tabDirection: direction };
      void this.router.navigateByUrl(target.path, { info });
    }
  }
}
