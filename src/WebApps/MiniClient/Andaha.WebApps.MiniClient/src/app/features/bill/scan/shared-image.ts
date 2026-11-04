/** Cache und Schlüssel, in die der Service Worker (custom-sw.js) ein per Share Target geteiltes Bild legt */
export const SHARED_IMAGE_CACHE = 'share-target';
export const SHARED_IMAGE_KEY = '/shared-image';

/**
 * Holt das geteilte Bild aus dem Cache und löscht den Eintrag, damit es genau einmal verarbeitet wird.
 * Liefert null, wenn nichts geteilt wurde oder der Cache nicht verfügbar ist.
 */
export async function takeSharedImage(cacheStorage: CacheStorage | undefined = globalThis.caches): Promise<File | null> {
  if (!cacheStorage) {
    return null;
  }
  try {
    const cache = await cacheStorage.open(SHARED_IMAGE_CACHE);
    const response = await cache.match(SHARED_IMAGE_KEY);
    if (!response) {
      return null;
    }
    await cache.delete(SHARED_IMAGE_KEY);
    const blob = await response.blob();
    const type = blob.type || response.headers.get('Content-Type') || 'image/jpeg';
    const name = response.headers.get('X-File-Name') || 'shared-image';
    return new File([blob], name, { type });
  } catch (error) {
    console.error('Reading shared image failed', error);
    return null;
  }
}
