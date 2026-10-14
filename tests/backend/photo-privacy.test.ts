import { afterEach, expect, test, vi } from 'vitest';
import { shrinkPhoto } from '../../src/photo';
afterEach(() => vi.unstubAllGlobals());
test('photo reduction releases bitmap and canvas pixels and retains no original file metadata', async () => {
  const close = vi.fn(); const bitmap = { width: 1000, height: 1000, close };
  const canvas = { width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }), toDataURL: vi.fn(() => 'data:image/jpeg;base64,synthetic') };
  vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap));
  vi.stubGlobal('document', { createElement: () => canvas });
  expect(await shrinkPhoto(new File(['synthetic'], 'not-retained-name.jpg', { type: 'image/jpeg' }))).toBe('data:image/jpeg;base64,synthetic');
  expect(close).toHaveBeenCalledOnce(); expect(canvas.width).toBe(0); expect(canvas.height).toBe(0);
});
test('failed canvas preparation still releases the decoded bitmap', async () => {
  const close = vi.fn();
  const canvas = { width: 0, height: 0, getContext: () => null };
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 1, height: 1, close })));
  vi.stubGlobal('document', { createElement: () => canvas });
  await expect(shrinkPhoto(new File(['synthetic'], 'synthetic.jpg', { type: 'image/jpeg' }))).rejects.toThrow('prepare');
  expect(close).toHaveBeenCalledOnce(); expect(canvas.width).toBe(0);
});
