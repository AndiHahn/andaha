import { SHARED_IMAGE_KEY, takeSharedImage } from './shared-image';

type FetchHandler = (event: { request: Request; respondWith: (response: Promise<Response>) => void }) => void;

/**
 * Share-Target-Teil von `src/custom-sw.js` (AC38, Review I4): das Skript wird wie im Service Worker
 * ausgeführt, mit nachgebildetem `self`, `caches` und ohne den Angular-Worker (`importScripts`).
 */
describe('custom-sw.js share target', () => {
  let fetchHandler: FetchHandler;
  let stored: Map<string, Response>;

  beforeAll(async () => {
    const response = await fetch('/custom-sw.js');
    const source = await response.text();
    expect(source).toContain("importScripts('./ngsw-worker.js')");

    stored = new Map();
    const cache = { put: async (key: string, value: Response) => void stored.set(key, value) };
    const self = { addEventListener: (type: string, handler: FetchHandler) => { if (type === 'fetch') { fetchHandler = handler; } } };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function('self', 'importScripts', 'caches', source)(self, () => undefined, { open: async () => cache });
  });

  beforeEach(() => {
    stored.clear();
  });

  async function share(file?: File): Promise<Response> {
    const body = new FormData();
    if (file) {
      body.append('image', file);
    }
    let result: Promise<Response> | undefined;
    fetchHandler({
      request: new Request(new URL('/share-target?ngsw-bypass=true', location.origin), { method: 'POST', body }),
      respondWith: response => result = response
    });
    expect(result, 'respondWith').toBeDefined();
    return result!;
  }

  function cachedEntry(): CacheStorage {
    const cache = {
      match: async (key: string) => stored.get(key),
      delete: async (key: string) => stored.delete(key)
    };
    return { open: async () => cache } as unknown as CacheStorage;
  }

  it('caches an image and opens the list with shared=1', async () => {
    const response = await share(new File(['png'], 'beleg.png', { type: 'image/png' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toMatch(/\/bill\/list\?shared=1$/);
    const file = await takeSharedImage(cachedEntry());
    expect(file!.name).toBe('beleg.png');
    expect(file!.type).toBe('image/png');
  });

  it('keeps a file name outside Latin-1 (emoji, CJK)', async () => {
    const response = await share(new File(['jpg'], 'Rechnung 🧾 東京.jpg', { type: 'image/jpeg' }));

    expect(response.headers.get('Location')).toMatch(/shared=1$/);
    expect(stored.has(SHARED_IMAGE_KEY)).toBe(true);
    const file = await takeSharedImage(cachedEntry());
    expect(file!.name).toBe('Rechnung 🧾 東京.jpg');
  });

  it('accepts a file without MIME type and leaves the check to the scan', async () => {
    const response = await share(new File(['jpg'], 'IMG_0001', { type: '' }));

    expect(response.headers.get('Location')).toMatch(/shared=1$/);
    const file = await takeSharedImage(cachedEntry());
    expect(file!.size).toBe(3);
    // kein angenommenes JPEG: compressImage kodiert neu bzw. der Scan meldet „nicht lesbar“
    expect(file!.type).not.toBe('image/jpeg');
  });

  it('reports a share without usable file with shared=0 instead of dropping it silently', async () => {
    const text = await share(new File(['hallo'], 'notiz.txt', { type: 'text/plain' }));
    const empty = await share();

    expect(text.headers.get('Location')).toMatch(/\/bill\/list\?shared=0$/);
    expect(empty.headers.get('Location')).toMatch(/\/bill\/list\?shared=0$/);
    expect(stored.size).toBe(0);
  });
});
