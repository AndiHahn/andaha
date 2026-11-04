import { compressImage, readExifOrientation } from './image-utils';

async function canvasImage(width: number, height: number, type: 'image/jpeg' | 'image/png', quality?: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'red';
  context.fillRect(0, 0, width, height);
  return new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), type, quality));
}

/** APP1/Exif-Segment mit genau einem IFD0-Eintrag „Orientation“ (0x0112, SHORT) */
function exifSegment(orientation: number, littleEndian: boolean): Uint8Array<ArrayBuffer> {
  const tiff = new DataView(new ArrayBuffer(26));
  tiff.setUint16(0, littleEndian ? 0x4949 : 0x4d4d);
  tiff.setUint16(2, 42, littleEndian);
  tiff.setUint32(4, 8, littleEndian);
  tiff.setUint16(8, 1, littleEndian);
  tiff.setUint16(10, 0x0112, littleEndian);
  tiff.setUint16(12, 3, littleEndian);
  tiff.setUint32(14, 1, littleEndian);
  tiff.setUint16(18, orientation, littleEndian);
  tiff.setUint32(22, 0, littleEndian);

  const payload = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0, ...new Uint8Array(tiff.buffer)]);
  const segment = new Uint8Array(4 + payload.length);
  segment.set([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]);
  segment.set(payload, 4);
  return segment;
}

/** JPEG mit Exif-Orientation direkt hinter SOI */
async function withOrientation(jpeg: Blob, orientation: number, littleEndian = false): Promise<File> {
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  return new File([bytes.slice(0, 2), exifSegment(orientation, littleEndian), bytes.slice(2)], 'photo.jpg', { type: 'image/jpeg' });
}

async function size(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const result = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return result;
}

describe('readExifOrientation', () => {
  it('reads orientation from big-endian exif', async () => {
    const file = await withOrientation(await canvasImage(40, 20, 'image/jpeg'), 6);

    expect(await readExifOrientation(file)).toBe(6);
  });

  it('reads orientation from little-endian exif', async () => {
    const file = await withOrientation(await canvasImage(40, 20, 'image/jpeg'), 8, true);

    expect(await readExifOrientation(file)).toBe(8);
  });

  it('returns 1 for jpeg without exif', async () => {
    expect(await readExifOrientation(await canvasImage(40, 20, 'image/jpeg'))).toBe(1);
  });

  it('returns 1 for non-jpeg and broken data', async () => {
    expect(await readExifOrientation(await canvasImage(40, 20, 'image/png'))).toBe(1);
    expect(await readExifOrientation(new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00])]))).toBe(1);
    expect(await readExifOrientation(new Blob([]))).toBe(1);
  });
});

describe('compressImage', () => {
  it('defaults to long edge 1600 px as jpeg', async () => {
    const png = await canvasImage(3000, 1000, 'image/png');

    const result = await compressImage(png);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('image.jpg');
    expect(await size(result)).toEqual({ width: 1600, height: 533 });
  });

  it('resizes a 3000 px jpeg to 1600 px long edge', async () => {
    const input = new File([await canvasImage(1500, 3000, 'image/jpeg')], 'photo.jpg', { type: 'image/jpeg' });

    const result = await compressImage(input);

    expect(result).not.toBe(input);
    expect(result.type).toBe('image/jpeg');
    expect(await size(result)).toEqual({ width: 800, height: 1600 });
  });

  it('returns a 1200 px jpeg without rotation unchanged (no second re-encode)', async () => {
    const input = new File([await canvasImage(1200, 800, 'image/jpeg', 0.95)], 'photo.jpg', { type: 'image/jpeg' });

    const result = await compressImage(input);

    expect(result).toBe(input);
  });

  it('keeps a small jpeg with exif orientation 1 unchanged', async () => {
    const input = await withOrientation(await canvasImage(1200, 800, 'image/jpeg'), 1);

    expect(await compressImage(input)).toBe(input);
  });

  it('re-encodes a small jpeg with exif orientation 6 into rotated pixels', async () => {
    const input = await withOrientation(await canvasImage(1200, 800, 'image/jpeg'), 6);

    const result = await compressImage(input);

    expect(result).not.toBe(input);
    expect(result.type).toBe('image/jpeg');
    expect(await readExifOrientation(result)).toBe(1);
    expect(await size(result)).toEqual({ width: 800, height: 1200 });
  });

  it('returns input when image cannot be decoded', async () => {
    const input = new Blob(['x']);

    const result = await compressImage(input);

    expect(result.size).toBe(input.size);
    expect(result.type).toBe(input.type);
  });
});
