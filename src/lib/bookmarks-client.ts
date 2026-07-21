// Client-only: bookmarks live in localStorage (no account system in this
// project), so this module must never run during SSG. Only import it from
// <script> blocks, not from .astro frontmatter.

export interface BookmarkItem {
  url: string;
  title: string;
  description: string;
  source: string;
  category: string;
  publishedAt: string;
  savedAt: string;
}

const STORAGE_KEY = 'wdf:bookmarks';
export const BOOKMARKS_CHANGED_EVENT = 'wdf:bookmarks-changed';

export function getBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookmarkItem[]) : [];
  } catch {
    return [];
  }
}

function save(bookmarks: BookmarkItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { count: bookmarks.length } }));
}

export function isBookmarked(url: string): boolean {
  return getBookmarks().some((b) => b.url === url);
}

/** Adds or removes the bookmark for `item.url`. Returns the new saved state. */
export function toggleBookmark(item: Omit<BookmarkItem, 'savedAt'>): boolean {
  const bookmarks = getBookmarks();
  const existingIndex = bookmarks.findIndex((b) => b.url === item.url);

  if (existingIndex >= 0) {
    bookmarks.splice(existingIndex, 1);
    save(bookmarks);
    return false;
  }

  bookmarks.unshift({ ...item, savedAt: new Date().toISOString() });
  save(bookmarks);
  return true;
}

export function removeBookmark(url: string): void {
  save(getBookmarks().filter((b) => b.url !== url));
}
