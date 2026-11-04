import { SHARED_IMAGE_CACHE, SHARED_IMAGE_KEY, takeSharedImage } from './shared-image';

/** Minimaler Cache-Storage-Ersatz: eine benannte Map von URL auf Response */
function createCacheStorage(): { storage: CacheStorage; entries: Map<string, Response> } {
  const entries = new Map<string, Response>();
  const cache = {
    match: async (key: string) => entries.get(key),
    delete: async (key: string) => entries.delete(key)
  };
  const storage = { open: async () => cache } as unknown as CacheStorage;
  return { storage, entries };
}

describe('takeSharedImage', () => {
  it('returns the cached image as a file with its type and deletes the entry', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob(['abc'], { type: 'image/png' }), { headers: { 'Content-Type': 'image/png' } }));

    const file = await takeSharedImage(storage);

    expect(file).toBeInstanceOf(File);
    expect(file!.type).toBe('image/png');
    expect(file!.size).toBe(3);
    expect(entries.has(SHARED_IMAGE_KEY)).toBe(false);
  });

  it('returns null for an empty cache', async () => {
    const { storage } = createCacheStorage();
    expect(await takeSharedImage(storage)).toBeNull();
  });

  it('returns null on the second call', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg' } }));

    expect(await takeSharedImage(storage)).not.toBeNull();
    expect(await takeSharedImage(storage)).toBeNull();
  });

  it('returns null when the cache storage is unavailable', async () => {
    expect(await takeSharedImage(undefined as unknown as CacheStorage)).toBeNull();
  });

  it('uses the share-target cache', () => {
    expect(SHARED_IMAGE_CACHE).toBe('share-target');
  });
});
