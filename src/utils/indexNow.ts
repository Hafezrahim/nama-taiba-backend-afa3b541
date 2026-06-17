// Helper to submit URLs to IndexNow (Bing/Yandex) via our edge function.
// Fire-and-forget: never blocks or throws into the calling save handler.
import { supabase } from '@/integrations/supabase/client';

const SITE_ORIGIN =
  (typeof window !== 'undefined' && window.location?.origin?.includes('nama-taiba'))
    ? window.location.origin
    : 'https://www.nama-taiba.com';

const slugify = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export type IndexNowEntity =
  | { type: 'product'; nameEn?: string | null }
  | { type: 'project'; titleEn?: string | null }
  | { type: 'blog'; slug?: string | null; titleEn?: string | null };

export function buildEntityUrls(entity: IndexNowEntity): string[] {
  const urls: string[] = [];
  switch (entity.type) {
    case 'product': {
      const slug = slugify(entity.nameEn || '');
      urls.push(`${SITE_ORIGIN}/products`);
      if (slug) urls.push(`${SITE_ORIGIN}/products/${slug}`);
      break;
    }
    case 'project': {
      const slug = slugify(entity.titleEn || '');
      urls.push(`${SITE_ORIGIN}/projects`);
      if (slug) urls.push(`${SITE_ORIGIN}/projects/${slug}`);
      break;
    }
    case 'blog': {
      const slug = entity.slug || slugify(entity.titleEn || '');
      urls.push(`${SITE_ORIGIN}/blog`);
      if (slug) urls.push(`${SITE_ORIGIN}/blog/${slug}`);
      break;
    }
  }
  return urls;
}

export function submitIndexNow(urls: string[]): void {
  if (!urls?.length) return;
  // Don't await — keep the admin save flow fast and never surface IndexNow
  // failures to the user.
  supabase.functions
    .invoke('indexnow-submit', { body: { urls } })
    .then((res) => {
      if (res.error) console.warn('[indexnow] submit failed:', res.error);
    })
    .catch((e) => console.warn('[indexnow] submit threw:', e));
}

export function pingIndexNowForEntity(entity: IndexNowEntity): void {
  submitIndexNow(buildEntityUrls(entity));
}
