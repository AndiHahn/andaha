import { evaluateSwipe, isSwipeExcluded } from './swipe';

describe('swipe', () => {
  describe('evaluateSwipe', () => {
    const width = 390;

    it('returns next for a 61 px swipe to the left', () => {
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 139, y: 300 }, width)).toBe('next');
    });

    it('returns prev for a 61 px swipe to the right', () => {
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 261, y: 300 }, width)).toBe('prev');
    });

    it('ignores a 59 px swipe', () => {
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 141, y: 300 }, width)).toBeNull();
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 259, y: 300 }, width)).toBeNull();
    });

    it('ignores a diagonal swipe at 45°', () => {
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 100, y: 200 }, width)).toBeNull();
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 300, y: 400 }, width)).toBeNull();
    });

    it('accepts a slightly slanted swipe below 30°', () => {
      // atan(40/100) ≈ 21.8°
      expect(evaluateSwipe({ x: 200, y: 300 }, { x: 100, y: 340 }, width)).toBe('next');
    });

    it('ignores swipes starting in the outer 24 px (system back gesture)', () => {
      expect(evaluateSwipe({ x: 10, y: 300 }, { x: 110, y: 300 }, width)).toBeNull();
      expect(evaluateSwipe({ x: width - 10, y: 300 }, { x: width - 110, y: 300 }, width)).toBeNull();
    });
  });

  // Review Focus 3: Wischen auf Chip-Streifen oder in Eingabefeldern wechselt den Tab nicht
  describe('isSwipeExcluded', () => {
    let host: HTMLElement;

    beforeEach(() => {
      host = document.createElement('div');
      document.body.appendChild(host);
    });

    afterEach(() => host.remove());

    function render(html: string): void {
      host.innerHTML = html;
    }

    it('excludes an input field', () => {
      render('<input id="t" type="text">');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('excludes an element inside a mat-form-field', () => {
      render('<mat-form-field><div><span id="t">Betrag</span></div></mat-form-field>');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('excludes a chip inside a chip listbox', () => {
      render('<mat-chip-listbox><mat-chip-option><span id="t">Lebensmittel</span></mat-chip-option></mat-chip-listbox>');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('excludes a chip in a horizontally scrollable strip', () => {
      render(`
        <div class="strip" style="display: flex; width: 200px; overflow-x: auto">
          <button id="t" style="flex: none; width: 150px">Lebensmittel</button>
          <button style="flex: none; width: 150px">Drogerie</button>
        </div>`);
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('does not exclude an overflowing container that clips instead of scrolling', () => {
      render(`
        <div style="display: flex; width: 200px; overflow-x: hidden">
          <span id="t" style="flex: none; width: 300px">Text</span>
        </div>`);
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(false);
    });

    it('excludes elements marked with data-no-swipe', () => {
      render('<div data-no-swipe><span id="t">Foto</span></div>');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('excludes pinch-zoom photos', () => {
      render('<pinch-zoom><img id="t" alt=""></pinch-zoom>');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(true);
    });

    it('does not exclude a plain div in a list row', () => {
      render('<div class="row"><div id="t">Billa · 12,30 €</div></div>');
      expect(isSwipeExcluded(host.querySelector('#t'))).toBe(false);
    });

    it('does not exclude a missing target', () => {
      expect(isSwipeExcluded(null)).toBe(false);
    });
  });
});
