import { FreeAnchor } from './tour-steps';
import { Rect } from './tour-targets';

export interface NoteInput {
  id: string;
  target: Rect | null;
  freeAnchor?: FreeAnchor;
  size: { width: number; height: number };
}
export interface Point {
  x: number;
  y: number;
}
/** Cubic Bézier */
export interface Arrow {
  from: Point;
  to: Point;
  c1: Point;
  c2: Point;
}
/** arrow is null for free notes */
export interface NotePlacement {
  id: string;
  box: Rect;
  arrow: Arrow | null;
}

type Side = 'below' | 'above' | 'right' | 'left';

const MARGIN = 16;
const FREE_TOP = 56;
const ARROW_END_OFFSET = 4;
const CURVE = 0.3;
const STEP = 8;
export const MAX_NOTE_DISTANCE = 160;
const SIDES: Side[] = ['below', 'above', 'right', 'left'];

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

function clampInto(r: Rect, vp: { width: number; height: number }): Rect {
  return {
    ...r,
    x: clamp(r.x, MARGIN, Math.max(MARGIN, vp.width - MARGIN - r.width)),
    y: clamp(r.y, MARGIN, Math.max(MARGIN, vp.height - MARGIN - r.height)),
  };
}

export function placeNotes(
  notes: NoteInput[],
  targets: Rect[],
  viewport: { width: number; height: number },
  gap = 12,
): NotePlacement[] {
  const placed: NotePlacement[] = [];
  const obstacles = (): Rect[] => [...targets, ...placed.map((p) => p.box)];
  const fitsViewport = (r: Rect) =>
    r.x >= MARGIN && r.y >= MARGIN && r.x + r.width <= viewport.width - MARGIN && r.y + r.height <= viewport.height - MARGIN;
  const isFree = (r: Rect) => fitsViewport(r) && !obstacles().some((o) => overlaps(r, o));

  for (const note of notes) {
    if (note.target === null) {
      placed.push({ id: note.id, box: placeFree(note, isFree, viewport), arrow: null });
      continue;
    }
    const target = note.target;
    const space: Record<Side, number> = {
      below: viewport.height - (target.y + target.height),
      above: target.y,
      right: viewport.width - (target.x + target.width),
      left: target.x,
    };
    // Stable sort: ties keep the order below, above, right, left.
    const sides = [...SIDES].sort((a, b) => space[b] - space[a]);
    const boxAt = (side: Side, distance: number): Rect => candidate(side, distance, target, note.size, viewport);

    let chosen: { box: Rect; side: Side } | null = null;
    const tried: { box: Rect; side: Side; distance: number; order: number }[] = [];
    search: for (let distance = gap; distance <= Math.max(gap, MAX_NOTE_DISTANCE); distance += STEP) {
      for (const side of sides) {
        const box = boxAt(side, distance);
        if (isFree(box)) {
          chosen = { box, side };
          break search;
        }
        tried.push({ box: clampInto(box, viewport), side, distance, order: sides.indexOf(side) });
      }
    }
    if (!chosen) {
      // Nothing fits: least total overlap wins; ties go to the nearer, then to the side order.
      const blockers = obstacles();
      const overlap = (r: Rect) => blockers.reduce((sum, o) => sum + overlapArea(r, o), 0);
      const best = tried
        .map((c) => ({ ...c, area: overlap(c.box) }))
        .sort((x, y) => x.area - y.area || x.distance - y.distance || x.order - y.order)[0];
      chosen = { box: best.box, side: best.side };
    }
    placed.push({ id: note.id, box: chosen.box, arrow: arrowFor(chosen.box, chosen.side, target) });
  }
  return placed;
}

function candidate(side: Side, distance: number, t: Rect, size: { width: number; height: number }, vp: { width: number; height: number }): Rect {
  const { width, height } = size;
  const cx = clamp(t.x + t.width / 2 - width / 2, MARGIN, Math.max(MARGIN, vp.width - MARGIN - width));
  const cy = clamp(t.y + t.height / 2 - height / 2, MARGIN, Math.max(MARGIN, vp.height - MARGIN - height));
  switch (side) {
    case 'below':
      return { x: cx, y: t.y + t.height + distance, width, height };
    case 'above':
      return { x: cx, y: t.y - distance - height, width, height };
    case 'right':
      return { x: t.x + t.width + distance, y: cy, width, height };
    case 'left':
      return { x: t.x - distance - width, y: cy, width, height };
  }
}

function placeFree(note: NoteInput, isFree: (r: Rect) => boolean, vp: { width: number; height: number }): Rect {
  const { width, height } = note.size;
  const x = (vp.width - width) / 2;
  if (note.freeAnchor === 'top') return clampInto({ x, y: FREE_TOP, width, height }, vp);
  const y0 = (vp.height - height) / 2;
  // Shift vertically (alternating down/up) until the note overlaps nothing.
  for (let offset = 0; offset <= vp.height; offset += STEP) {
    for (const y of offset === 0 ? [y0] : [y0 + offset, y0 - offset]) {
      const box = clampInto({ x, y, width, height }, vp);
      if (isFree(box)) return box;
    }
  }
  return clampInto({ x, y: y0, width, height }, vp);
}

function arrowFor(box: Rect, side: Side, t: Rect): Arrow {
  let from: Point;
  let to: Point;
  const clampX = (v: number) => clamp(v, t.x, t.x + t.width);
  const clampY = (v: number) => clamp(v, t.y, t.y + t.height);
  const midX = box.x + box.width / 2;
  const midY = box.y + box.height / 2;
  switch (side) {
    case 'below':
      from = { x: midX, y: box.y };
      to = { x: clampX(midX), y: t.y + t.height + ARROW_END_OFFSET };
      break;
    case 'above':
      from = { x: midX, y: box.y + box.height };
      to = { x: clampX(midX), y: t.y - ARROW_END_OFFSET };
      break;
    case 'right':
      from = { x: box.x, y: midY };
      to = { x: t.x + t.width + ARROW_END_OFFSET, y: clampY(midY) };
      break;
    case 'left':
      from = { x: box.x + box.width, y: midY };
      to = { x: t.x - ARROW_END_OFFSET, y: clampY(midY) };
      break;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  // Unit normal to the from->to direction; offset gives the hand-drawn curve.
  const nx = dist === 0 ? 0 : -dy / dist;
  const ny = dist === 0 ? 0 : dx / dist;
  const off = dist * CURVE;
  return {
    from,
    to,
    c1: { x: from.x + dx / 3 + nx * off, y: from.y + dy / 3 + ny * off },
    c2: { x: from.x + (2 * dx) / 3 + nx * off, y: from.y + (2 * dy) / 3 + ny * off },
  };
}
