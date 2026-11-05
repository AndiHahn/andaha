import { evaluateRowSwipe } from './row-swipe';

describe('evaluateRowSwipe', () => {
  const width = 400;

  it('ignores a steep gesture (vertical scrolling)', () => {
    expect(evaluateRowSwipe(-200, 140, width)).toBeNull();
  });

  it('ignores a short gesture of 20 px', () => {
    expect(evaluateRowSwipe(-20, 0, width)).toBeNull();
    expect(evaluateRowSwipe(20, 0, width)).toBeNull();
  });

  it('opens delete for -30 % of the row width', () => {
    expect(evaluateRowSwipe(-0.3 * width, 0, width)).toBe('open-delete');
  });

  it('deletes for -45 % of the row width', () => {
    expect(evaluateRowSwipe(-0.45 * width, 10, width)).toBe('delete');
  });

  it('duplicates for +45 % of the row width', () => {
    expect(evaluateRowSwipe(0.45 * width, -10, width)).toBe('duplicate');
  });

  it('opens duplicate for +30 % of the row width', () => {
    expect(evaluateRowSwipe(0.3 * width, 0, width)).toBe('open-duplicate');
  });

  it('triggers the action from 40 % on', () => {
    expect(evaluateRowSwipe(-0.4 * width, 0, width)).toBe('delete');
    expect(evaluateRowSwipe(-0.4 * width + 1, 0, width)).toBe('open-delete');
  });
});
