import { shouldDismissSheet } from './sheet-drag.directive';

describe('shouldDismissSheet', () => {
  it('dismisses after dragging more than 80 px down', () => {
    expect(shouldDismissSheet(81, 0.1)).toBe(true);
  });

  it('dismisses a fast flick below the distance threshold', () => {
    expect(shouldDismissSheet(30, 0.6)).toBe(true);
  });

  it('springs back for a short, slow drag', () => {
    expect(shouldDismissSheet(80, 0.5)).toBe(false);
    expect(shouldDismissSheet(20, 0.2)).toBe(false);
  });

  it('springs back when the sheet was dragged upwards again', () => {
    expect(shouldDismissSheet(0, -1)).toBe(false);
  });
});
