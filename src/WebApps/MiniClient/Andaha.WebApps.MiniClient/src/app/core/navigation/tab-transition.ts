import { DOCUMENT, inject } from '@angular/core';
import { Router, ViewTransitionInfo } from '@angular/router';
import { TabNavigationInfo } from './tab-swipe.directive';

const DIRECTION_CLASSES = ['tab-next', 'tab-prev'];

/**
 * `withViewTransitions({ onViewTransitionCreated })`: Tab-Wechsel (Wischen oder Tipp) gleiten in
 * Richtung `info.tabDirection` (Klasse `tab-next`/`tab-prev` an <html>, CSS in styles.scss).
 * Alle anderen Navigationen und alle bei `prefers-reduced-motion` laufen ohne Animation.
 *
 * Bewusst ohne `transition.skipTransition()`: das verwirft das ready-Promise, und der Router
 * schreibt das im Dev-Modus bei jeder Navigation als Fehler in die Konsole. Ohne Richtungsklasse
 * setzt das CSS alle View-Transition-Animationen auf none, die Transition endet im nächsten Frame.
 */
export function onTabViewTransition({ transition }: ViewTransitionInfo): void {
  const root = inject(DOCUMENT).documentElement;
  root.classList.remove(...DIRECTION_CLASSES);

  const info = inject(Router).currentNavigation()?.extras.info as Partial<TabNavigationInfo> | undefined;
  const direction = info?.tabDirection;
  if ((direction !== 'next' && direction !== 'prev') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const directionClass = `tab-${direction}`;
  root.classList.add(directionClass);
  const cleanUp = () => root.classList.remove(directionClass);
  transition.finished.then(cleanUp, cleanUp);
}
