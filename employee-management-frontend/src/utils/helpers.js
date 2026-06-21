import { getCurrency } from './currency';

export const formatCurrency = (amount, currency) => {
  currency = currency || getCurrency();
  // Pick a sensible locale per currency for correct symbol placement.
  const locale = { INR: 'en-IN', GBP: 'en-GB', EUR: 'de-DE', JPY: 'ja-JP' }[currency] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount || 0);
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  }
};

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

/** Format a number of seconds as "Hh Mm Ss" (e.g. 3725 -> "1h 02m 05s"). */
export const formatDuration = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
};

/** Short clock format "HH:MM" from seconds. */
export const formatHM = (totalSeconds = 0) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const employmentTypeLabel = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
};

export const statusColor = {
  active: 'badge-active',
  inactive: 'badge-inactive',
};

export const employmentTypeColor = {
  full_time: 'badge-ft',
  part_time: 'badge-pt',
  contract: 'badge-ct',
};
