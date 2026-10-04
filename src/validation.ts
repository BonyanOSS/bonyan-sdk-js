import { ValidationError } from './errors.js';
import type { PrayerMethod } from './types.js';

/** Total number of surahs in the Quran. */
export const TOTAL_SURAH = 114;
/** Total number of ayat in the Quran (global). */
export const TOTAL_AYAT = 6236;
/** Max number of ayat in a single surah (Al-Baqarah holds the record at 286). */
export const MAX_AYAT_PER_SURAH = 286;

export interface PrayerLocation {
  date?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  /** Supported calculation method; defaults to Umm al-Qura (4). */
  method?: PrayerMethod;
  /** IANA timezone used to format HH:mm timings; defaults to UTC. */
  timezone?: string;
}

export function ensureSurahNumber(value: number): void {
  ensureIntegerInRange('surah', value, 1, TOTAL_SURAH);
}

/**
 * Validates a verse number inside a surah (1..286). For the global aya id
 * (1..6236), call {@link ensureIntegerInRange} with `TOTAL_AYAT` instead.
 */
export function ensureAyaNumber(value: number, field = 'aya'): void {
  ensureIntegerInRange(field, value, 1, MAX_AYAT_PER_SURAH);
}

export function ensurePositiveInteger(field: string, value: number): void {
  ensureIntegerInRange(field, value, 1, Number.MAX_SAFE_INTEGER);
}

export function ensureIntegerInRange(field: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`, field);
  }
}

export function ensureNonEmptyString(field: string, value: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`, field);
  }
}

export function ensureLimit(limit: number | undefined, max: number): void {
  if (limit === undefined) return;
  ensureIntegerInRange('limit', limit, 1, max);
}

/** Validates a DD-MM-YYYY date string used by the prayer/hijri endpoints. */
export function ensureDate(date: string): void {
  if (typeof date !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    throw new ValidationError('date must use DD-MM-YYYY format', 'date');
  }
  const [day, month, year] = date.split('-').map(Number) as [number, number, number];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1000 ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new ValidationError('date must be a valid Gregorian date', 'date');
  }
}

export function ensureHijriDate(date: string): void {
  if (typeof date !== 'string' || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    throw new ValidationError('date must use DD-MM-YYYY format', 'date');
  }
  const [day, month, year] = date.split('-').map(Number) as [number, number, number];
  if (day < 1 || day > 30 || month < 1 || month > 12 || year < 1 || year > 2400) {
    throw new ValidationError('date must be a valid Hijri date with year between 1 and 2400', 'date');
  }
}

export function ensureTafsirEdition(edition: string): void {
  if (edition !== 'muyassar' && edition !== 'saadi') {
    throw new ValidationError('edition must be muyassar or saadi', 'edition');
  }
}

export function ensureLatitude(latitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new ValidationError('latitude must be between -90 and 90', 'latitude');
  }
}

export function ensureLongitude(longitude: number): void {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ValidationError('longitude must be between -180 and 180', 'longitude');
  }
}

export function ensureHadithRange(options?: { from?: number; to?: number }): void {
  if (!options) return;

  if (options.from !== undefined) ensurePositiveInteger('from', options.from);
  if (options.to !== undefined) ensurePositiveInteger('to', options.to);

  const from = options.from ?? 1;
  const to = options.to ?? from + 29;
  ensurePositiveInteger('to', to);
  if (to < from) {
    throw new ValidationError('to must be greater than or equal to from', 'to');
  }
  if (to - from + 1 > 300) {
    throw new ValidationError('hadith range cannot exceed 300 items', 'to');
  }
}

export function ensurePrayerLocation(options: PrayerLocation): void {
  if (options.date !== undefined) ensureDate(options.date);
  if (options.method !== undefined && ![1, 2, 3, 4, 5, 9, 10, 11].includes(options.method)) {
    throw new ValidationError('method must be 1, 2, 3, 4, 5, 9, 10 or 11', 'method');
  }
  if (options.timezone !== undefined) {
    ensureNonEmptyString('timezone', options.timezone);
    try {
      new Intl.DateTimeFormat('en', { timeZone: options.timezone.trim() });
    } catch {
      throw new ValidationError('timezone must be a valid IANA timezone', 'timezone');
    }
  }

  const hasCoords = options.latitude !== undefined || options.longitude !== undefined;
  const hasCity = options.city !== undefined || options.country !== undefined;

  if (hasCoords) {
    if (options.latitude === undefined || options.longitude === undefined) {
      throw new ValidationError(
        'latitude and longitude must be provided together',
        options.latitude === undefined ? 'latitude' : 'longitude',
      );
    }
    ensureLatitude(options.latitude);
    ensureLongitude(options.longitude);
    return;
  }

  if (hasCity) {
    if (options.city === undefined || options.country === undefined) {
      throw new ValidationError(
        'city and country must be provided together',
        options.city === undefined ? 'city' : 'country',
      );
    }
    ensureNonEmptyString('city', options.city);
    ensureNonEmptyString('country', options.country);
    return;
  }

  throw new ValidationError('provide either latitude/longitude or city/country', 'location');
}
