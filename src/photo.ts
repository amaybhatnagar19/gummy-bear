export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a photo, such as a JPEG or PNG.');
  if (file.size > 25000000) throw new Error('This photo is too large. Choose one under 25 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This photo could not be opened. Try a JPEG or PNG photo.'); });
  let canvas: HTMLCanvasElement | undefined;
  try {
    const ratio = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Your browser could not prepare the photo.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.75, 0.55, 0.35]) { const image = canvas.toDataURL('image/jpeg', quality); if (image.length <= 350000) return image; }
    throw new Error('This photo is too detailed. Try a closer photo with fewer toys.');
  } finally { bitmap.close(); if (canvas) { canvas.width = 0; canvas.height = 0; } }
}
