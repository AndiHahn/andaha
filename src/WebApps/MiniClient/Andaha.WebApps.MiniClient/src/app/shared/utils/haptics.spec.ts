import { vibrate } from './haptics';

describe('vibrate', () => {
  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>)['vibrate'];
  });

  it('calls navigator.vibrate with 30 ms by default', () => {
    const spy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true });
    vibrate();
    expect(spy).toHaveBeenCalledWith(30);
    vibrate(50);
    expect(spy).toHaveBeenLastCalledWith(50);
  });
  it('is a no-op without navigator.vibrate', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => vibrate()).not.toThrow();
  });
  it('swallows errors from navigator.vibrate', () => {
    Object.defineProperty(navigator, 'vibrate', { value: () => { throw new Error('x'); }, configurable: true });
    expect(() => vibrate()).not.toThrow();
  });
});
