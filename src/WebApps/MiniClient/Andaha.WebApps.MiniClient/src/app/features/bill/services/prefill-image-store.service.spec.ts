import { TestBed } from '@angular/core/testing';
import { PrefillImageStore } from './prefill-image-store.service';

describe('PrefillImageStore', () => {
  let store: PrefillImageStore;
  const photo = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    store = TestBed.inject(PrefillImageStore);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('hands the image back under its key (also more than once, e.g. Back then Forward to the form)', () => {
    const key = store.put(photo);

    expect(typeof key).toBe('string');
    expect(store.get(key)).toBe(photo);
    expect(store.get(key)).toBe(photo);
  });

  it('keeps only the latest image', () => {
    const first = store.put(photo);
    const second = store.put(new File(['x'], 'other.jpg', { type: 'image/jpeg' }));

    expect(second).not.toBe(first);
    expect(store.get(first)).toBeNull();
    expect(store.get(second)?.name).toBe('other.jpg');
  });

  it('returns null for an unknown or missing key (reload of /bill/create)', () => {
    expect(store.get('unknown')).toBeNull();
    expect(store.get(undefined)).toBeNull();
  });
});
