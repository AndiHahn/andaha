function toFile(blob: Blob): File {
  if (blob instanceof File) {
    return blob;
  }

  return new File([blob], 'image', { type: blob.type });
}

export async function compressImage(file: Blob, maxEdge: number = 2000, quality: number = 0.85): Promise<File> {
  try {
    // EXIF-Ausrichtung beibehalten (Handyfotos)
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as unknown as ImageBitmapOptions);

    try {
      // Bereits JPEG und klein genug: unverändert zurückgeben (kein zweites verlustbehaftetes Re-Encode)
      if (file.type === 'image/jpeg' && Math.max(bitmap.width, bitmap.height) <= maxEdge) {
        return toFile(file);
      }

      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        return toFile(file);
      }

      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) {
        return toFile(file);
      }

      return new File([blob], 'image.jpg', { type: 'image/jpeg' });
    } finally {
      bitmap.close();
    }
  } catch {
    return toFile(file);
  }
}
