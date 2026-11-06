import { TestBed } from '@angular/core/testing';
import { AcknowledgedStore, acknowledgedKey } from './acknowledged-store';

describe('AcknowledgedStore', () => {
  const today = new Date(2026, 10, 6, 9, 30);

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function create(): AcknowledgedStore {
    TestBed.resetTestingModule();
    return TestBed.inject(AcknowledgedStore);
  }

  it('builds the key from the local day', () => {
    expect(acknowledgedKey(new Date(2026, 0, 2, 23, 59))).toBe('andaha.analysis.ack.2026-01-02');
  });

  it('remembers acknowledged bills for today in localStorage', () => {
    const store = create();

    expect(store.isAcknowledged('b1')).toBe(false);
    store.acknowledge('b1');

    expect(store.isAcknowledged('b1')).toBe(true);
    expect(store.isAcknowledged('b2')).toBe(false);
    expect(JSON.parse(localStorage.getItem('andaha.analysis.ack.2026-11-06')!)).toEqual(['b1']);
    expect(create().isAcknowledged('b1')).toBe(true);
  });

  it('removes entries of earlier days on start and keeps foreign keys', () => {
    localStorage.setItem('andaha.analysis.ack.2026-11-05', '["old"]');
    localStorage.setItem('andaha.analysis.ack.2026-11-06', '["b1"]');
    localStorage.setItem('andaha.other', 'x');

    const store = create();

    expect(localStorage.getItem('andaha.analysis.ack.2026-11-05')).toBeNull();
    expect(store.isAcknowledged('b1')).toBe(true);
    expect(localStorage.getItem('andaha.other')).toBe('x');
  });

  it('starts empty after midnight', () => {
    const store = create();
    store.acknowledge('b1');

    vi.setSystemTime(new Date(2026, 10, 7, 0, 5));

    expect(store.isAcknowledged('b1')).toBe(false);
  });

  it('ignores broken stored values', () => {
    localStorage.setItem('andaha.analysis.ack.2026-11-06', 'not json');

    const store = create();

    expect(store.isAcknowledged('b1')).toBe(false);
    store.acknowledge('b1');
    expect(store.isAcknowledged('b1')).toBe(true);
  });
});
