// Resize photos to JPEG data URLs. Only data URLs are stored, never Blob refs.
const FULL = { side: 1400, q: 0.6 };
const THUMB = { side: 320, q: 0.55 };

function render(bitmap, { side, q }) {
  const k = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}

// file -> { image, thumb }
export async function prepare(file) {
  if (!file.type.startsWith('image/')) throw new Error('errImg');
  const bitmap = await createImageBitmap(file);
  try {
    return { image: render(bitmap, FULL), thumb: render(bitmap, THUMB) };
  } finally {
    bitmap.close();
  }
}

// "data:image/jpeg;base64,XXXX" -> "XXXX"
export const base64 = (dataUrl) => dataUrl.slice(dataUrl.indexOf(',') + 1);
