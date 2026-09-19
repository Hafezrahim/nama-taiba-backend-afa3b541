import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips HTML tags and decodes common entities to produce clean plain text for card previews and excerpts.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return "";

  // Insert space at block-level boundary tags and breaks so words do not merge together
  const spaced = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|table|ul|ol)>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, " ");

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(spaced, "text/html");
      return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    } catch {
      // fallback
    }
  }

  return spaced
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
