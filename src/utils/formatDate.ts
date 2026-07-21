/** Absolute date, e.g. "20 Jul 2026" — used in machine-readable/meta contexts. */
export function formatDate(date: Date, lang = 'en-GB'): string {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const RTF_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

/** Relative time, e.g. "4h ago", for story-card timestamps. */
export function relativeTime(date: Date, now: Date = new Date(), lang = 'en-GB'): string {
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) return 'just now';

  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });

  for (const { unit, seconds } of RTF_UNITS) {
    if (absSeconds >= seconds) {
      const value = Math.round(diffSeconds / seconds);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(Math.round(diffSeconds / 60), 'minute');
}
