/**
 * Date/time formatting utilities.
 *
 * The server sends ISO strings like "2026-03-09T16:29:37:258"
 * (milliseconds separated by ":" not "."). parseDate() normalises this
 * before handing to the Date constructor.
 */

/** Normalise server timestamp quirks and return a Date object. */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Fix "2026-03-09T16:29:37:258" → "2026-03-09T16:29:37.258"
  // The pattern is: digit:digit:digit:digits at the end — replace last colon with dot
  const fixed = String(value).replace(/(\d{2}:\d{2}:\d{2}):(\d+)$/, '$1.$2');
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? null : d;
}

/** Zero out h/m/s/ms to get the start of a calendar day. */
function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/**
 * Format just the time portion: "6:30 PM"
 */
export function formatTime(value) {
  const d = parseDate(value);
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Relative date label (no time):
 *   today          → "Today"
 *   yesterday      → "Yesterday"
 *   ≤ 6 days ago   → "Mon", "Tue", ...  (same week feel)
 *   same year      → "9 Mar"
 *   different year → "9 Mar 2025"
 */
export function formatRelativeDate(value) {
  const d = parseDate(value);
  if (!d) return '';

  const now = new Date();
  const todayStart = startOfDay(now);
  const targetStart = startOfDay(d);
  const diffDays = Math.round((todayStart - targetStart) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 6) return d.toLocaleDateString([], { weekday: 'short' }); // "Mon"

  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString([], { day: 'numeric', month: 'short' })         // "9 Mar"
    : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' }); // "9 Mar 25"
}

/**
 * Relative date + time:
 *   today          → "6:30 PM"
 *   yesterday      → "Yesterday · 6:30 PM"
 *   ≤ 6 days ago   → "Mon · 6:30 PM"
 *   same year      → "9 Mar · 6:30 PM"
 *   different year → "9 Mar 25 · 6:30 PM"
 */
export function formatRelativeDateTime(value) {
  const d = parseDate(value);
  if (!d) return '';

  const time = formatTime(d);
  const now = new Date();
  const todayStart = startOfDay(now);
  const targetStart = startOfDay(d);
  const diffDays = Math.round((todayStart - targetStart) / 86400000);

  if (diffDays === 0) return time;
  return `${formatRelativeDate(d)} · ${time}`;
}

/**
 * Long date heading for timeline sections:
 *   today          → "Today"
 *   yesterday      → "Yesterday"
 *   ≤ 6 days ago   → "Monday"  (full weekday)
 *   same year      → "Monday, 9 Mar"
 *   different year → "9 Mar 2025"
 */
export function formatDateHeading(dateStr) {
  // dateStr is YYYY-MM-DD
  const d = parseDate(dateStr + 'T12:00:00');
  if (!d) return dateStr;

  const now = new Date();
  const todayStart = startOfDay(now);
  const targetStart = startOfDay(d);
  const diffDays = Math.round((todayStart - targetStart) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 6) return d.toLocaleDateString([], { weekday: 'long' }); // "Monday"

  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) // "Mon, 9 Mar"
    : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });  // "9 Mar 2025"
}

/**
 * Duration string from two timestamps:
 *   < 60 min  → "45m"
 *   ≥ 60 min  → "1h 30m"
 */
export function formatDuration(startedAt, completedAt) {
  if (!startedAt) return '';
  const start = parseDate(startedAt)?.getTime();
  const end = completedAt ? parseDate(completedAt)?.getTime() : Date.now();
  if (!start || !end) return '';
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
