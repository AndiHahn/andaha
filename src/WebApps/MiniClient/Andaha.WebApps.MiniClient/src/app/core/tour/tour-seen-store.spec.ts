import { TOUR_SEEN_KEY, TourSeenStore } from './tour-seen-store';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  } as Storage;
}

describe('TourSeenStore', () => {
  it('not seen when key absent', () => {
    expect(new TourSeenStore(() => memoryStorage()).isSeenOrUnavailable()).toBe(false);
  });

  it('seen when key is "1"', () => {
    const store = new TourSeenStore(() => memoryStorage({ [TOUR_SEEN_KEY]: '1' }));
    expect(store.isSeenOrUnavailable()).toBe(true);
  });

  it('markSeen writes "1"', () => {
    const storage = memoryStorage();
    new TourSeenStore(() => storage).markSeen();
    expect(storage.getItem('andaha.tour.v1.seen')).toBe('1');
  });

  it('unavailable storage counts as seen', () => {
    const store = new TourSeenStore(() => {
      throw new Error('denied');
    });
    expect(store.isSeenOrUnavailable()).toBe(true);
  });

  it('markSeen swallows errors', () => {
    const store = new TourSeenStore(() => {
      throw new Error('denied');
    });
    expect(() => store.markSeen()).not.toThrow();
  });
});
