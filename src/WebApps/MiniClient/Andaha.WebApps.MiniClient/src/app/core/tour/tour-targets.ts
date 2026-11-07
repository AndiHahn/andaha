import { TourTargetId } from './tour-steps';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** First element with [data-tour=id] that has width and height > 0, is not visibility:hidden and intersects the viewport */
export function resolveTarget(
  id: TourTargetId,
  root: ParentNode,
  viewport: { width: number; height: number },
): Element | null {
  const candidates = root.querySelectorAll(`[data-tour="${id}"]`);
  for (const el of Array.from(candidates)) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    const intersects = r.right > 0 && r.bottom > 0 && r.left < viewport.width && r.top < viewport.height;
    if (intersects) return el;
  }
  return null;
}

export function rectOf(element: Element): Rect {
  const r = element.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}
