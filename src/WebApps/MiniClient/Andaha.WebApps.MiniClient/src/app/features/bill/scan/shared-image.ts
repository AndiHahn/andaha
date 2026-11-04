/** Cache und Schlüssel, in die der Service Worker (custom-sw.js) ein per Share Target geteiltes Bild legt */
export const SHARED_IMAGE_CACHE = 'share-target';
export const SHARED_IMAGE_KEY = '/shared-image';

/** Hinweis, wenn der Service Worker kein brauchbares Bild bekam (`/bill/list?shared=0`) */
export const SHARED_IMAGE_FAILED = 'Das geteilte Bild konnte nicht übernommen werden.';

export interface LaunchIntent {
  /** App-Shortcut „Rechnung eintragen“ (`?quick=1`): Schnellerfassung öffnen */
  quick: boolean;
  /** Share Target: `?shared=1` Bild liegt im Cache, `?shared=0` geteilt, aber unbrauchbar */
  shared: 'image' | 'failed' | null;
}

/** Start-Absicht aus den Query-Parametern der Rechnungsliste (AC37, AC38) */
export function readLaunchIntent(params: { get(name: string): string | null }): LaunchIntent {
  const shared = params.get('shared');
  return {
    quick: params.get('quick') === '1',
    shared: shared === '1' ? 'image' : shared === '0' ? 'failed' : null
  };
}

/** Dateiname aus dem Header `X-File-Name` (vom Service Worker URI-kodiert, Header sind nur Latin-1) */
function fileNameOf(response: Response): string {
  const raw = response.headers.get('X-File-Name');
  if (!raw) {
    return 'shared-image';
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

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
    // ohne MIME-Typ geteilt: kein JPEG annehmen, sonst übernähme compressImage die Datei ungeprüft;
    // so kodiert es neu bzw. der Scan meldet ein nicht lesbares Foto
    const type = blob.type || response.headers.get('Content-Type') || 'application/octet-stream';
    return new File([blob], fileNameOf(response), { type });
  } catch (error) {
    console.error('Reading shared image failed', error);
    return null;
  }
}
