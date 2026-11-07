import { tourSteps } from './tour-steps';

const mobile = { desktop: false, hasTiles: true };
const desktop = { desktop: true, hasTiles: true };
const notes = (opts: { desktop: boolean; hasTiles: boolean }, stepId: string) =>
  tourSteps(opts).find((s) => s.id === stepId)!.notes;

describe('tourSteps', () => {
  it('returns menus, entry, templates in this order', () => {
    expect(tourSteps(mobile).map((s) => s.id)).toEqual(['menus', 'entry', 'templates']);
    expect(tourSteps(mobile).map((s) => s.title)).toEqual(['Menüs', 'Eintragen', 'Vorlagen']);
  });

  it('mobile menus step has the swipe hint, desktop has not', () => {
    const swipe = notes(mobile, 'menus').filter((n) => n.swipeArrows);
    expect(swipe.length).toBe(1);
    expect(swipe[0].target).toBeNull();
    expect(swipe[0].freeAnchor).toBe('center');
    expect(notes(desktop, 'menus').some((n) => n.swipeArrows)).toBe(false);
  });

  it('desktop Untermenü text mentions klicken', () => {
    const tabs = notes(desktop, 'menus').find((n) => n.target === 'tabs')!;
    expect(tabs.text).toContain('klicken');
    expect(notes(mobile, 'menus').find((n) => n.target === 'tabs')!.text).not.toContain('klicken');
  });

  it('bill-row label is "Lang drücken" on mobile and "Rechtsklick" on desktop', () => {
    expect(notes(mobile, 'entry').find((n) => n.target === 'bill-row')!.label).toBe('Lang drücken');
    expect(notes(desktop, 'entry').find((n) => n.target === 'bill-row')!.label).toBe('Rechtsklick');
  });

  it('tabs note has tone sub and label Untermenü, main-nav note has tone main and label Hauptmenü', () => {
    const menus = notes(mobile, 'menus');
    const tabs = menus.find((n) => n.target === 'tabs')!;
    const nav = menus.find((n) => n.target === 'main-nav')!;
    expect([tabs.tone, tabs.label]).toEqual(['sub', 'Untermenü']);
    expect([nav.tone, nav.label]).toEqual(['main', 'Hauptmenü']);
  });

  it('templates text without tiles uses the "Hier erscheinen" copy', () => {
    const without = notes({ desktop: false, hasTiles: false }, 'templates').find((n) => n.target === 'tiles')!;
    expect(without.text).toContain('Hier erscheinen');
    const withTiles = notes(mobile, 'templates').find((n) => n.target === 'tiles')!;
    expect(withTiles.text).toContain('Lang drücken');
    expect(notes(desktop, 'templates').find((n) => n.target === 'tiles')!.text).toContain('Rechtsklick');
  });

  it('only templates opens the quick entry', () => {
    expect(tourSteps(mobile).map((s) => s.opensQuickEntry)).toEqual([false, false, true]);
  });

  it('has a free top note for the template management hint', () => {
    const free = notes(mobile, 'templates').find((n) => n.target === null)!;
    expect(free.freeAnchor).toBe('top');
  });
});
