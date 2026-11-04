/** Lange Kante und JPEG-Qualität für jedes Rechnungsfoto (AC29) */
export const IMAGE_MAX_EDGE = 1600;
export const IMAGE_QUALITY = 0.8;

/** Bis hierhin wird nach dem Exif-Segment gesucht; APP1 ist höchstens 64 KB groß und steht vorn */
const EXIF_SEARCH_BYTES = 128 * 1024;
const ORIENTATION_TAG = 0x0112;

function toFile(blob: Blob): File {
  if (blob instanceof File) {
    return blob;
  }

  return new File([blob], 'image', { type: blob.type });
}

/**
 * Exif-Ausrichtung (Tag 0x0112 in IFD0) eines JPEG, 1–8; 1 = normal. Kein JPEG, kein Exif oder
 * kaputte Daten: 1.
 */
export async function readExifOrientation(file: Blob): Promise<number> {
  try {
    const view = new DataView(await file.slice(0, EXIF_SEARCH_BYTES).arrayBuffer());
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
      return 1;
    }

    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) {
        return 1;
      }
      const marker = view.getUint8(offset + 1);
      if (marker === 0xff) {
        offset++; // Füllbyte
        continue;
      }
      if (marker === 0xda || marker === 0xd9) {
        return 1; // Bilddaten beginnen bzw. Ende: kein Exif davor
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2; // Marker ohne Länge
        continue;
      }
      const length = view.getUint16(offset + 2);
      if (length < 2) {
        return 1;
      }
      if (marker === 0xe1 && isExifHeader(view, offset + 4)) {
        return orientationFromTiff(view, offset + 10, Math.min(offset + 2 + length, view.byteLength));
      }
      offset += 2 + length;
    }
    return 1;
  } catch {
    return 1;
  }
}

/** „Exif\0\0“ */
function isExifHeader(view: DataView, offset: number): boolean {
  return offset + 6 <= view.byteLength
    && view.getUint32(offset) === 0x45786966
    && view.getUint16(offset + 4) === 0;
}

function orientationFromTiff(view: DataView, tiff: number, end: number): number {
  if (tiff + 8 > end) {
    return 1;
  }
  const byteOrder = view.getUint16(tiff);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) {
    return 1;
  }
  const little = byteOrder === 0x4949;
  if (view.getUint16(tiff + 2, little) !== 42) {
    return 1;
  }

  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > end) {
    return 1;
  }
  const entries = view.getUint16(ifd, little);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) {
      return 1;
    }
    if (view.getUint16(entry, little) === ORIENTATION_TAG) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

/**
 * Verkleinert ein Foto auf JPEG (lange Kante ≤ maxEdge). Ein JPEG innerhalb der Grenze ohne
 * Exif-Drehung bleibt unverändert (kein zweites verlustbehaftetes Kodieren); mit Drehung wird neu
 * kodiert, damit die Drehung in den Pixeln steckt. Nicht lesbare Dateien kommen unverändert zurück.
 */
export async function compressImage(file: Blob, maxEdge: number = IMAGE_MAX_EDGE, quality: number = IMAGE_QUALITY): Promise<File> {
  try {
    // Exif-Ausrichtung anwenden (Handyfotos)
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    try {
      if (file.type === 'image/jpeg'
        && Math.max(bitmap.width, bitmap.height) <= maxEdge
        && await readExifOrientation(file) === 1) {
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

      // JPEG kennt keine Transparenz: weißer Grund statt Schwarz (z. B. PNG-Screenshots)
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);
      context.imageSmoothingQuality = 'high';
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
