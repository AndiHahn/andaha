import { NoteInput, placeNotes } from './tour-placement';
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
});
