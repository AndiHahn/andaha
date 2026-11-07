import { rectOf, resolveTarget } from './tour-targets';

const viewport = { width: 400, height: 800 };

interface R {
  x: number;
  y: number;
  width: number;
  height: number;
}

function add(id: string, rect: Partial<R>, style = ''): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-tour', id);
  const r = { x: 0, y: 0, width: 100, height: 40, ...rect };
  el.getBoundingClientRect = () =>
    ({
      x: r.x,
      y: r.y,
      left: r.x,
      top: r.y,
      right: r.x + r.width,
      bottom: r.y + r.height,
      width: r.width,
      height: r.height,
      toJSON: () => ({}),
    }) as DOMRect;
  el.style.cssText = style;
  document.body.appendChild(el);
  return el;
}

describe('resolveTarget', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('returns the first visible match and skips zero-size ones', () => {
    add('entry', { width: 0, height: 0 });
    const second = add('entry', {});
    add('entry', { y: 100 });
    expect(resolveTarget('entry', document, viewport)).toBe(second);
  });

  it('skips visibility:hidden', () => {
    add('camera', {}, 'visibility:hidden');
    const visible = add('camera', { y: 60 });
    expect(resolveTarget('camera', document, viewport)).toBe(visible);
  });

  it('skips elements outside the viewport', () => {
    add('tabs', { x: 500 });
    add('tabs', { y: 900 });
    add('tabs', { y: -100 });
    const inside = add('tabs', { x: 390, y: 10 });
    expect(resolveTarget('tabs', document, viewport)).toBe(inside);
  });

  it('returns null when none matches', () => {
    add('tabs', {});
    expect(resolveTarget('tiles', document, viewport)).toBeNull();
  });
});

describe('rectOf', () => {
  afterEach(() => (document.body.innerHTML = ''));

  it('maps the bounding client rect', () => {
    const el = add('entry', { x: 1, y: 2, width: 3, height: 4 });
    expect(rectOf(el)).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });
});
