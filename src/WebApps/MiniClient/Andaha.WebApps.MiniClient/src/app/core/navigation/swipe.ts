// Wischgeste zwischen den Tabs eines Bereichs (AC4, v2 01-navigation): reine Logik, die Direktive
// tab-swipe.directive.ts liefert nur die Touch-Punkte.

export interface SwipePoint {
  x: number;
  y: number;
}

/** Mindestweg waagrecht in px */
const MIN_DISTANCE = 60;
/** Höchster Winkel zur Waagrechten in Grad */
const MAX_ANGLE = 30;
/** Randzone in px, dort beginnt die System-Zurück-Geste */
const EDGE = 24;

/**
 * Richtung der Geste oder null: nur bei klar waagrechter Geste (|dx| > 60 px, Winkel < 30°),
 * nicht mit Start in den äußeren 24 px. Nach links gewischt = nächster Tab.
 */
export function evaluateSwipe(start: SwipePoint, end: SwipePoint, viewportWidth: number): 'next' | 'prev' | null {
  if (start.x < EDGE || start.x > viewportWidth - EDGE) {
    return null;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) <= MIN_DISTANCE) {
    return null;
  }

  const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
  if (angle >= MAX_ANGLE) {
    return null;
  }

  return dx < 0 ? 'next' : 'prev';
}

/** Elemente, auf denen die Geste nie startet: Eingaben, Formulare, Chip-Streifen, Fotos */
const EXCLUDED = [
  'input', 'textarea', 'select', 'form', 'mat-form-field',
  'mat-chip-listbox', 'mat-chip-set', 'pinch-zoom', '[pinch-zoom]', '[data-no-swipe]'
].join(', ');

/** true, wenn das Startelement oder ein Vorfahre ausgeschlossen oder waagrecht scrollbar ist. */
export function isSwipeExcluded(target: Element | null): boolean {
  if (!target) {
    return false;
  }

  if (target.closest(EXCLUDED)) {
    return true;
  }

  for (let element: Element | null = target; element; element = element.parentElement) {
    if (element.scrollWidth > element.clientWidth && scrollsHorizontally(element)) {
      return true;
    }
  }

  return false;
}

function scrollsHorizontally(element: Element): boolean {
  const overflowX = getComputedStyle(element).overflowX;
  return overflowX !== 'visible' && overflowX !== 'hidden' && overflowX !== 'clip';
}
