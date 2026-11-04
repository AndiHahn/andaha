import { compressImage } from 'src/app/shared/utils/image-utils';
import { SHARED_IMAGE_CACHE, SHARED_IMAGE_KEY, readLaunchIntent, takeSharedImage } from './shared-image';

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

  it('decodes the URI encoded file name of the service worker', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), {
      headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': encodeURIComponent('Kassabon 🧾 ä.jpg') }
    }));

    expect((await takeSharedImage(storage))!.name).toBe('Kassabon 🧾 ä.jpg');
  });

  it('keeps a name that is not URI encoded', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), { headers: { 'X-File-Name': '100%.jpg' } }));

    expect((await takeSharedImage(storage))!.name).toBe('100%.jpg');
  });

  it('does not assume JPEG for a file shared without MIME type', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob(['abc'])));

    const file = await takeSharedImage(storage);

    expect(file!.type).toBe('application/octet-stream');
    expect(file!.name).toBe('shared-image');
  });

  it('hands an untyped photo to the scan as decodable image (compressImage → JPEG)', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 10;
    canvas.getContext('2d')!.fillRect(0, 0, 20, 10);
    const png = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
    const { storage, entries } = createCacheStorage();
    entries.set(SHARED_IMAGE_KEY, new Response(new Blob([png])));

    const compressed = await compressImage((await takeSharedImage(storage))!);

    expect(compressed.type).toBe('image/jpeg');
  });
});

describe('readLaunchIntent', () => {
  const params = (query: string) => new URLSearchParams(query);

  it('reads the app shortcut', () => {
    expect(readLaunchIntent(params('quick=1'))).toEqual({ quick: true, shared: null });
  });

  it('reads a share with image and a failed share', () => {
    expect(readLaunchIntent(params('shared=1'))).toEqual({ quick: false, shared: 'image' });
    expect(readLaunchIntent(params('shared=0'))).toEqual({ quick: false, shared: 'failed' });
  });

  it('ignores other values', () => {
    expect(readLaunchIntent(params('quick=0&shared=x'))).toEqual({ quick: false, shared: null });
  });
});
