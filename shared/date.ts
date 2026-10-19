// Reminder dates are plain "YYYY-MM-DD" strings (local calendar day, no timezone math).

export function isValidDateOnly(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// A reminder is "due" once its day has arrived and the link hasn't been opened since that day began.
export function isReminderDue(remindAt?: string | null, lastViewedAt?: string | null, today = localDateString()): boolean {
  if (!remindAt || remindAt > today) return false;
  if (!lastViewedAt) return true;
  const viewed = new Date(lastViewedAt);
  if (isNaN(viewed.getTime())) return true;
  return localDateString(viewed) < remindAt;
}
