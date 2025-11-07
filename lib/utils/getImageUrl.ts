import {
  TCV_CDN
} from '@/lib/env.server'

export const getImageUrl = (img?: string | null): string | null => {
    if (!img) return null;

    // If already an absolute URL, return unchanged
    if (/^https?:\/\//i.test(img)) return img;

    // Try server-side env first; if you need this on the client, expose it as NEXT_PUBLIC_TCV_CDN
    const cdnBase = TCV_CDN ?? process.env.NEXT_PUBLIC_TCV_CDN;
    if (!cdnBase) {
      // no CDN configured — return original string or null depending on your preference
      return img;
    }

    // Normalize: remove trailing slash from env and remove the "TCV_CDN/" prefix from image path
    const base = cdnBase.replace(/\/+$/, '');
    const path = img.replace(/^TCV_CDN\/?/, '').replace(/^\/+/, '');

    // encodeURI is used so slashes remain slashes but spaces/special chars get encoded
    return `${base}/${encodeURI(path)}`;
  };