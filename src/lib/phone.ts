/**
 * TechInPedia Centralized Phone Normalization Service
 * International-ready canonical E.164 standardization and fuzzy CRM deduplication.
 */

export interface NormalizedPhone {
  raw: string;
  canonical: string; // e.g. +919818768680
  digitsOnly: string; // e.g. 919818768680
  nationalNumber: string; // e.g. 9818768680
  countryCode: string; // e.g. 91
  isValid: boolean;
}

/**
 * Normalizes any user-entered phone number into canonical E.164 format.
 * Strips formatting (spaces, hyphens, brackets, leading zeros).
 * Preserves international country codes.
 */
export function normalizePhone(rawPhone?: string | null, fallbackCountry = '91'): NormalizedPhone {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      raw: '',
      canonical: '',
      digitsOnly: '',
      nationalNumber: '',
      countryCode: '',
      isValid: false,
    };
  }

  const trimmed = rawPhone.trim();
  let digits = trimmed.replace(/[^0-9]/g, '');

  if (!digits || digits.length < 5) {
    return {
      raw: trimmed,
      canonical: '',
      digitsOnly: digits,
      nationalNumber: digits,
      countryCode: '',
      isValid: false,
    };
  }

  let countryCode = '';
  let nationalNumber = '';

  if (trimmed.startsWith('+')) {
    // Explicit international number provided
    // Country codes: 1-3 digits
    if (digits.length === 11 && digits.startsWith('1')) {
      // US / Canada (+1)
      countryCode = '1';
      nationalNumber = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      // India (+91)
      countryCode = '91';
      nationalNumber = digits.slice(2);
    } else if (digits.length === 12 && digits.startsWith('44')) {
      // UK (+44)
      countryCode = '44';
      nationalNumber = digits.slice(2);
    } else if (digits.length === 12 && digits.startsWith('971')) {
      // UAE (+971)
      countryCode = '971';
      nationalNumber = digits.slice(3);
    } else if (digits.length === 13 && digits.startsWith('971')) {
      countryCode = '971';
      nationalNumber = digits.slice(3);
    } else if (digits.length > 10) {
      // Assume standard 2-digit country code if not matched
      countryCode = digits.slice(0, digits.length - 10);
      nationalNumber = digits.slice(-10);
    } else {
      countryCode = fallbackCountry;
      nationalNumber = digits;
    }
  } else {
    // No leading plus: check standard length conventions
    if (digits.length === 10) {
      // Standard 10-digit mobile number
      countryCode = fallbackCountry;
      nationalNumber = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      // 0-prefixed 10-digit number (e.g. 09818768680)
      countryCode = fallbackCountry;
      nationalNumber = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      // 919818768680 without plus
      countryCode = '91';
      nationalNumber = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // 1-prefixed US number
      countryCode = '1';
      nationalNumber = digits.slice(1);
    } else if (digits.length > 10) {
      countryCode = digits.slice(0, digits.length - 10);
      nationalNumber = digits.slice(-10);
    } else {
      countryCode = fallbackCountry;
      nationalNumber = digits;
    }
  }

  const canonical = `+${countryCode}${nationalNumber}`;
  const digitsOnly = `${countryCode}${nationalNumber}`;
  const isValid = nationalNumber.length >= 7 && nationalNumber.length <= 12;

  return {
    raw: trimmed,
    canonical,
    digitsOnly,
    nationalNumber,
    countryCode,
    isValid,
  };
}

/**
 * Builds Prisma OR query filters so that searching by any representation
 * (+919818768680, 919818768680, 09818768680, 9818768680) matches the record.
 */
export function buildPhoneSearchFilters(phoneInput?: string | null): Array<{ phone: { contains: string } }> {
  if (!phoneInput) return [];

  const norm = normalizePhone(phoneInput);
  if (!norm.nationalNumber) return [];

  const clauses = [
    { phone: { contains: norm.nationalNumber } }, // 9818768680
    { phone: { contains: norm.canonical } }, // +919818768680
    { phone: { contains: norm.digitsOnly } }, // 919818768680
  ];

  return clauses;
}

/**
 * Formats a canonical phone number for display (e.g. "+91 98187 68680").
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  const norm = normalizePhone(phone);
  if (!norm.isValid) return phone;

  if (norm.countryCode === '91' && norm.nationalNumber.length === 10) {
    return `+91 ${norm.nationalNumber.slice(0, 5)} ${norm.nationalNumber.slice(5)}`;
  }

  if (norm.countryCode === '1' && norm.nationalNumber.length === 10) {
    return `+1 (${norm.nationalNumber.slice(0, 3)}) ${norm.nationalNumber.slice(3, 6)}-${norm.nationalNumber.slice(6)}`;
  }

  return norm.canonical;
}
