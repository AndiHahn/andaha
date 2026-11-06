import { compressImage } from 'src/app/shared/utils/image-utils';
import { SHARED_IMAGE_CACHE, readLaunchIntent, sharedImageKey, takeSharedImages } from './shared-image';

/** Minimaler Cache-Storage-Ersatz: eine benannte Map von URL auf Response */
function createCacheStorage(): { storage: CacheStorage; entries: Map<string, Response> } {
  const entries = new Map<string, Response>();
  const path = (key: string | Request) => typeof key === 'string' ? key : new URL(key.url).pathname;
  const cache = {
    keys: async () => Array.from(entries.keys()).map(key => new Request(new URL(key, location.origin))),
    match: async (key: string | Request) => entries.get(path(key)),
    delete: async (key: string | Request) => entries.delete(path(key))
  };
  const storage = { open: async () => cache } as unknown as CacheStorage;
  return { storage, entries };
}

const KEY = sharedImageKey(0);

describe('takeSharedImages', () => {
  it('returns the cached image as a file with its type and deletes the entry', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob(['abc'], { type: 'image/png' }), { headers: { 'Content-Type': 'image/png' } }));

    const files = await takeSharedImages(storage);

    expect(files).toHaveLength(1);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0].type).toBe('image/png');
    expect(files[0].size).toBe(3);
    expect(entries.has(KEY)).toBe(false);
  });

  it('returns all shared images in order and deletes every entry', async () => {
    const { storage, entries } = createCacheStorage();
    ['a', 'b', 'c'].forEach((name, index) => entries.set(sharedImageKey(index), new Response(new Blob([name]), {
      headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': `${name}.jpg` }
    })));

    const files = await takeSharedImages(storage);

    expect(files.map(f => f.name)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    expect(entries.size).toBe(0);
  });

  it('reads all entries despite an index gap, including the legacy single key, and ignores other keys', async () => {
    const { storage, entries } = createCacheStorage();
    const add = (key: string, name: string) => entries.set(key, new Response(new Blob([name]), {
      headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': name }
    }));
    add(sharedImageKey(2), 'c.jpg');
    add(sharedImageKey(0), 'a.jpg');
    add('/shared-image', 'legacy.jpg');
    add(sharedImageKey(5), 'f.jpg');
    add('/other', 'other.jpg');

    const files = await takeSharedImages(storage);

    expect(files.map(f => f.name)).toEqual(['legacy.jpg', 'a.jpg', 'c.jpg', 'f.jpg']);
    expect(Array.from(entries.keys())).toEqual(['/other']);
  });

  it('deletes every entry even if reading one fails', async () => {
    const { storage, entries } = createCacheStorage();
    const broken = new Response(new Blob(['x']));
    vi.spyOn(broken, 'blob').mockRejectedValue(new Error('boom'));
    entries.set(sharedImageKey(0), broken);
    entries.set(sharedImageKey(1), new Response(new Blob(['b']), { headers: { 'X-File-Name': 'b.jpg' } }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const files = await takeSharedImages(storage);

    expect(files.map(f => f.name)).toEqual(['b.jpg']);
    expect(entries.size).toBe(0);
  });

  it('returns an empty list for an empty cache', async () => {
    const { storage } = createCacheStorage();
    expect(await takeSharedImages(storage)).toEqual([]);
  });

  it('returns an empty list on the second call', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), { headers: { 'Content-Type': 'image/jpeg' } }));

    expect(await takeSharedImages(storage)).toHaveLength(1);
    expect(await takeSharedImages(storage)).toEqual([]);
  });

  it('returns an empty list when the cache storage is unavailable', async () => {
    expect(await takeSharedImages(undefined as unknown as CacheStorage)).toEqual([]);
  });

  it('uses the share-target cache', () => {
    expect(SHARED_IMAGE_CACHE).toBe('share-target');
  });

  it('decodes the URI encoded file name of the service worker', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), {
      headers: { 'Content-Type': 'image/jpeg', 'X-File-Name': encodeURIComponent('Kassabon 🧾 ä.jpg') }
    }));

    expect((await takeSharedImages(storage))[0].name).toBe('Kassabon 🧾 ä.jpg');
  });

  it('keeps a name that is not URI encoded', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob(['abc'], { type: 'image/jpeg' }), { headers: { 'X-File-Name': '100%.jpg' } }));

    expect((await takeSharedImages(storage))[0].name).toBe('100%.jpg');
  });

  it('does not assume JPEG for a file shared without MIME type', async () => {
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob(['abc'])));

    const [file] = await takeSharedImages(storage);

    expect(file.type).toBe('application/octet-stream');
    expect(file.name).toBe('shared-image');
  });

  it('hands an untyped photo on as decodable image (compressImage → JPEG)', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 10;
    canvas.getContext('2d')!.fillRect(0, 0, 20, 10);
    const png = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
    const { storage, entries } = createCacheStorage();
    entries.set(KEY, new Response(new Blob([png])));

    const compressed = await compressImage((await takeSharedImages(storage))[0]);

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
