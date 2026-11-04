import { compressImage } from './image-utils';

describe('compressImage', () => {
  it('returns jpeg not larger than maxEdge', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 1000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'red';
    context.fillRect(0, 0, 3000, 1000);
    const png = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));

    const result = await compressImage(png, 2000);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('image.jpg');
    const bitmap = await createImageBitmap(result);
    expect(bitmap.width).toBe(2000);
    expect(bitmap.height).toBe(667);
    bitmap.close();
  });

  it('returns jpeg within maxEdge unchanged (no second re-encode)', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'blue';
    context.fillRect(0, 0, 400, 200);
    const jpeg = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.95));
    const input = new File([jpeg], 'photo.jpg', { type: 'image/jpeg' });

    const result = await compressImage(input, 2000);

    expect(result).toBe(input);
  });

  it('still resizes jpeg larger than maxEdge', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 1500;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'green';
    context.fillRect(0, 0, 3000, 1500);
    const jpeg = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg'));
    const input = new File([jpeg], 'photo.jpg', { type: 'image/jpeg' });

    const result = await compressImage(input, 2000);

    expect(result).not.toBe(input);
    expect(result.type).toBe('image/jpeg');
    const bitmap = await createImageBitmap(result);
    expect(bitmap.width).toBe(2000);
    expect(bitmap.height).toBe(1000);
    bitmap.close();
  });

  it('returns input when image cannot be decoded', async () => {
    const input = new Blob(['x']);

    const result = await compressImage(input);

    expect(result.size).toBe(input.size);
    expect(result.type).toBe(input.type);
  });
});
