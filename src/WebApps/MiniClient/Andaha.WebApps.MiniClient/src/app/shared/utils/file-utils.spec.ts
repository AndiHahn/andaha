import { canShareFiles, shareOrDownload } from './file-utils';

describe('shareOrDownload', () => {
  const blob = new Blob(['a;b'], { type: 'text/csv' });
  let click: ReturnType<typeof vi.spyOn>;
  let clickedDownloads: string[];

  beforeEach(() => {
    clickedDownloads = [];
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedDownloads.push(this.download);
    });
  });

  afterEach(() => {
    // eigene Eigenschaften am navigator-Objekt verdecken die des Prototyps; entfernen stellt den Browser-Stand her
    delete (navigator as unknown as Record<string, unknown>)['canShare'];
    delete (navigator as unknown as Record<string, unknown>)['share'];
  });

  function stubWebShare(canShare: (data: ShareData) => boolean, share: (data: ShareData) => Promise<void>): void {
    Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true, writable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
  }

  it('shares when canShare files', async () => {
    const share = vi.fn((_: ShareData) => Promise.resolve());
    stubWebShare(() => true, share);

    const result = await shareOrDownload(blob, 'Ausgaben.csv', 'text/csv');

    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledTimes(1);
    const file = share.mock.calls[0][0].files![0];
    expect(file.name).toBe('Ausgaben.csv');
    expect(file.type).toBe('text/csv');
    expect(click).not.toHaveBeenCalled();
    expect(canShareFiles()).toBe(true);
  });

  it('falls back to download', async () => {
    const share = vi.fn((_: ShareData) => Promise.resolve());
    stubWebShare(() => false, share);

    const result = await shareOrDownload(blob, 'Ausgaben.csv', 'text/csv');

    expect(result).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(clickedDownloads).toEqual(['Ausgaben.csv']);
    expect(canShareFiles()).toBe(false);
  });

  it('falls back to download without Web Share API', async () => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true, writable: true });

    const result = await shareOrDownload(blob, 'Ausgaben.csv', 'text/csv');

    expect(result).toBe('downloaded');
    expect(clickedDownloads).toEqual(['Ausgaben.csv']);
    expect(canShareFiles()).toBe(false);
  });

  it('returns cancelled on AbortError', async () => {
    stubWebShare(() => true, () => Promise.reject(new DOMException('Share canceled', 'AbortError')));

    const result = await shareOrDownload(blob, 'Ausgaben.csv', 'text/csv');

    expect(result).toBe('cancelled');
    expect(click).not.toHaveBeenCalled();
  });

  it('falls back to download when sharing fails otherwise', async () => {
    stubWebShare(() => true, () => Promise.reject(new DOMException('No user activation', 'NotAllowedError')));

    const result = await shareOrDownload(blob, 'Ausgaben.csv', 'text/csv');

    expect(result).toBe('downloaded');
    expect(clickedDownloads).toEqual(['Ausgaben.csv']);
  });
});
