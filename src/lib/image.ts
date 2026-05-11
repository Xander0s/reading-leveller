import type { ImageInput } from './types';

const MAX_DIM = 2000;
const JPEG_QUALITY = 0.85;

export async function fileToCompressedImage(file: File): Promise<ImageInput> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });

  const base64 = await blobToBase64(blob);
  return { base64, mediaType: 'image/jpeg' };
}

export function filesToCompressedImages(files: File[]): Promise<ImageInput[]> {
  return Promise.all(files.map(fileToCompressedImage));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
