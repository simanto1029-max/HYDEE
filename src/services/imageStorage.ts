import { supabase, isSupabaseConfigured } from './supabase';

// Product images are kept in Supabase Storage (a fast file store) instead of inside the database rows.
export const IMAGE_BUCKET = 'product-images';

export const isDataUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('data:image/');

export const containsDataUrl = (value: unknown): boolean => {
  if (typeof value === 'string') return isDataUrl(value);
  if (Array.isArray(value)) return value.some(containsDataUrl);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(containsDataUrl);
  return false;
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const extensionFor = (mime: string) => (mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg');

// Uploads one image and returns its public https link. Throws a readable error if storage is not set up.
export async function uploadDataUrlToStorage(dataUrl: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not connected.');
  const blob = dataUrlToBlob(dataUrl);
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionFor(blob.type)}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    throw new Error(
      /bucket/i.test(error.message)
        ? 'Image storage is not set up yet. Run supabase/HYDEE_IMAGE_STORAGE.sql in the Supabase SQL Editor.'
        : error.message
    );
  }
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Walks through any product object and replaces every embedded (base64) image with a Storage link.
export async function replaceDataUrlsWithStorageLinks<T>(
  value: T,
  cache: Map<string, string> = new Map(),
  onUploaded?: () => void
): Promise<T> {
  if (typeof value === 'string') {
    if (!isDataUrl(value)) return value;
    const cached = cache.get(value);
    if (cached) return cached as unknown as T;
    const url = await uploadDataUrlToStorage(value);
    cache.set(value, url);
    onUploaded?.();
    return url as unknown as T;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) out.push(await replaceDataUrlsWithStorageLinks(item, cache, onUploaded));
    return out as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await replaceDataUrlsWithStorageLinks(v, cache, onUploaded);
    }
    return out as T;
  }
  return value;
}

// Shrinks a photo picked from the phone / computer (max 1200px wide, JPEG 82%): the quality stays good, the file stays small.
export const compressImageFile = (file: File, maxWidth = 1200, quality = 0.82): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const original = String(e.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(original);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(original);
      img.src = original;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

// Saves a picture in fast image storage. If storage is not set up yet, the picture is still kept (embedded) so nothing is lost.
export async function storeImageDataUrl(dataUrl: string): Promise<{ url: string; warning?: string }> {
  if (!isDataUrl(dataUrl)) return { url: dataUrl };
  if (!isSupabaseConfigured || !supabase) return { url: dataUrl };
  try {
    return { url: await uploadDataUrlToStorage(dataUrl) };
  } catch (err: any) {
    return {
      url: dataUrl,
      warning: `${err?.message || 'Upload failed.'} The picture was still added, but it makes the website slower until image storage is set up.`,
    };
  }
}
