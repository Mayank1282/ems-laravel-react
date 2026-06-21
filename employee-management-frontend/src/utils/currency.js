// Company-wide currency, synced from backend settings on app load.
let active = localStorage.getItem('currency') || 'USD';
export const getCurrency = () => active;
export const setCurrency = (code) => { if (code) { active = code; localStorage.setItem('currency', code); } };

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
];

// Country dial codes with expected local phone-number digit length(s).
export const COUNTRY_CODES = [
  { code: '+1', iso: 'US', lengths: [10] },
  { code: '+44', iso: 'UK', lengths: [10] },
  { code: '+91', iso: 'IN', lengths: [10] },
  { code: '+61', iso: 'AU', lengths: [9] },
  { code: '+971', iso: 'AE', lengths: [9] },
  { code: '+65', iso: 'SG', lengths: [8] },
  { code: '+49', iso: 'DE', lengths: [10, 11] },
  { code: '+33', iso: 'FR', lengths: [9] },
  { code: '+81', iso: 'JP', lengths: [10] },
  { code: '+86', iso: 'CN', lengths: [11] },
  { code: '+92', iso: 'PK', lengths: [10] },
  { code: '+880', iso: 'BD', lengths: [10] },
];

/** Validate a phone number against its country code. Returns an error string or ''. */
export function validatePhone(countryCode, phone) {
  if (!phone) return '';
  if (!countryCode) return 'Select a country code.';
  const meta = COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!meta) return '';
  const digits = (phone.match(/\d/g) || []).length;
  if (!meta.lengths.includes(digits)) {
    return `Must be ${meta.lengths.join(' or ')} digits for ${countryCode}.`;
  }
  return '';
}
