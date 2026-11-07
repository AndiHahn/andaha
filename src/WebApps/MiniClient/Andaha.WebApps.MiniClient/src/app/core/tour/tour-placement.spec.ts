import { MAX_NOTE_DISTANCE, NoteInput, placeNotes } from './tour-placement';
import { Rect } from './tour-targets';

const VP = { width: 390, height: 844 };
const size = { width: 240, height: 60 };
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const inside = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.width <= VP.width && r.y + r.height <= VP.height;

describe('placeNotes', () => {
  it('places a note below a target at the top', () => {
    const t: Rect = { x: 0, y: 44, width: 390, height: 48 };
    const [p] = placeNotes([{ id: 'a', target: t, size }], [t], VP);
    expect(p.box.y).toBeGreaterThanOrEqual(t.y + t.height);
  });

  it('places a note above a target at the bottom (bottom bar 390×844)', () => {
    const t: Rect = { x: 0, y: 780, width: 390, height: 64 };
    const [p] = placeNotes([{ id: 'a', target: t, size }], [t], VP);
    expect(p.box.y + p.box.height).toBeLessThanOrEqual(t.y);
  });

  it('no note overlaps any target or another note', () => {
    const tabs: Rect = { x: 0, y: 44, width: 390, height: 48 };
    const bar: Rect = { x: 0, y: 780, width: 390, height: 64 };
    const dock: Rect = { x: 10, y: 712, width: 330, height: 44 };
    const camera: Rect = { x: 346, y: 712, width: 44, height: 44 };
    const targets = [tabs, bar, dock, camera];
    const notes: NoteInput[] = [
      { id: 'tabs', target: tabs, size },
      { id: 'bar', target: bar, size },
      { id: 'dock', target: dock, size },
      { id: 'camera', target: camera, size },
      { id: 'swipe', target: null, freeAnchor: 'center', size },
    ];
    const placed = placeNotes(notes, targets, VP);
    expect(placed.length).toBe(5);
    for (const p of placed) {
      expect(inside(p.box)).toBe(true);
      for (const t of targets) expect(overlaps(p.box, t)).toBe(false);
    }
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i].box, placed[j].box)).toBe(false);
  });

  it('free center note avoids targets', () => {
    const t: Rect = { x: 0, y: 380, width: 390, height: 100 };
    const [p] = placeNotes([{ id: 'f', target: null, freeAnchor: 'center', size }], [t], VP);
    expect(overlaps(p.box, t)).toBe(false);
    expect(inside(p.box)).toBe(true);
  });

  it('free top note sits 56px from the top, centred', () => {
    const [p] = placeNotes([{ id: 'f', target: null, freeAnchor: 'top', size }], [], VP);
    expect(p.box.y).toBe(56);
    expect(p.box.x).toBe((VP.width - size.width) / 2);
  });

  it('free top note moves below an obstacle at the top', () => {
    const topBar: Rect = { x: 0, y: 40, width: 390, height: 60 };
    const [p] = placeNotes([{ id: 'f', target: null, freeAnchor: 'top', size }], [topBar], VP);
    expect(p.box.y).toBeGreaterThanOrEqual(100);
    expect(p.box.y).toBeLessThan(100 + 8 + 1);
    expect(overlaps(p.box, topBar)).toBe(false);
    expect(inside(p.box)).toBe(true);
  });

  it('arrow ends on the target edge', () => {
    const t: Rect = { x: 0, y: 44, width: 390, height: 48 };
    const [p] = placeNotes([{ id: 'a', target: t, size }], [t], VP);
    expect(p.arrow).not.toBeNull();
    // note is below the target: arrow ends 4px below the target's bottom edge
    expect(p.arrow!.to.y).toBeCloseTo(t.y + t.height + 4, 5);
    expect(p.arrow!.to.x).toBeGreaterThanOrEqual(t.x);
    expect(p.arrow!.to.x).toBeLessThanOrEqual(t.x + t.width);
    expect(p.arrow!.from.y).toBeCloseTo(p.box.y, 5);
  });

  it('free notes have no arrow', () => {
    const [p] = placeNotes([{ id: 'f', target: null, freeAnchor: 'center', size }], [], VP);
    expect(p.arrow).toBeNull();
  });

  it('places a note right of / left of a target when above and below are blocked', () => {
    const small = { width: 100, height: 60 };
    const leftT: Rect = { x: 150, y: 16, width: 90, height: 812 };
    const [right] = placeNotes([{ id: 'a', target: leftT, size: small }], [leftT], VP);
    expect(right.box.x).toBeGreaterThanOrEqual(leftT.x + leftT.width);
    expect(overlaps(right.box, leftT)).toBe(false);
    const rightT: Rect = { x: 200, y: 16, width: 174, height: 812 };
    const [left] = placeNotes([{ id: 'b', target: rightT, size: small }], [rightT], VP);
    expect(left.box.x + left.box.width).toBeLessThanOrEqual(rightT.x);
    expect(overlaps(left.box, rightT)).toBe(false);
  });

  it('falls back to the least-overlapping clamped box when nothing fits', () => {
    const vp = { width: 300, height: 200 };
    const t: Rect = { x: 0, y: 0, width: 200, height: 200 };
    const [p] = placeNotes([{ id: 'a', target: t, size: { width: 100, height: 60 } }], [t], vp);
    expect(p.box.x).toBeGreaterThanOrEqual(16);
    expect(p.box.y).toBeGreaterThanOrEqual(16);
    expect(p.box.x + p.box.width).toBeLessThanOrEqual(vp.width - 16);
    expect(p.box.y + p.box.height).toBeLessThanOrEqual(vp.height - 16);
    // right side overlaps only 16px x 60px; every other side overlaps the whole box
    expect(p.box.x).toBe(184);
    expect(p.arrow).not.toBeNull();
  });

  it('never places a note farther than MAX_NOTE_DISTANCE from its target', () => {
    const tabs: Rect = { x: 0, y: 44, width: 390, height: 48 };
    const bar: Rect = { x: 0, y: 780, width: 390, height: 64 };
    const dock: Rect = { x: 10, y: 712, width: 330, height: 44 };
    const camera: Rect = { x: 346, y: 712, width: 44, height: 44 };
    const ts = [tabs, bar, dock, camera];
    const placed = placeNotes(ts.map((t, i) => ({ id: `n${i}`, target: t, size })), ts, VP);
    placed.forEach((p, i) => {
      const t = ts[i];
      const dx = Math.max(0, t.x - (p.box.x + p.box.width), p.box.x - (t.x + t.width));
      const dy = Math.max(0, t.y - (p.box.y + p.box.height), p.box.y - (t.y + t.height));
      expect(Math.max(dx, dy)).toBeLessThanOrEqual(MAX_NOTE_DISTANCE);
    });
  });

  it('keeps free notes inside the viewport margin', () => {
    const big = { width: 500, height: 60 };
    const [c] = placeNotes([{ id: 'c', target: null, freeAnchor: 'center', size: big }], [], VP);
    const [t] = placeNotes([{ id: 't', target: null, freeAnchor: 'top', size: big }], [], VP);
    expect(c.box.x).toBeGreaterThanOrEqual(16);
    expect(t.box.x).toBeGreaterThanOrEqual(16);
  });
});
