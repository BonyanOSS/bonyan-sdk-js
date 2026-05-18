import { ValidationError } from './errors.js';

export interface PrayerLocationOptions {
  date?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  method?: number;
}

export function validateSurah(value: number): void {
  validateIntegerRange('surah', value, 1, 114);
}

export function validatePositiveInteger(field: string, value: number): void {
  validateIntegerRange(field, value, 1, Number.MAX_SAFE_INTEGER);
}

export function validateIntegerRange(field: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`, field);
  }
}

export function validateNonEmptyString(field: string, value: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`, field);
  }
}

export function validateLimit(limit: number | undefined, max: number): void {
  if (limit === undefined) {
    return;
  }

  validateIntegerRange('limit', limit, 1, max);
}

export function validateDate(date: string): void {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    throw new ValidationError('date must use DD-MM-YYYY format', 'date');
  }
}

export function validateLatitude(latitude: number): void {
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new ValidationError('latitude must be between -90 and 90', 'latitude');
  }
}

export function validateLongitude(longitude: number): void {
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ValidationError('longitude must be between -180 and 180', 'longitude');
  }
}

export function validateHadithRange(options?: { from?: number; to?: number }): void {
  if (!options) {
    return;
  }

  if (options.from !== undefined) {
    validatePositiveInteger('from', options.from);
  }

  if (options.to !== undefined) {
    validatePositiveInteger('to', options.to);
  }

  if (options.from === undefined || options.to === undefined) {
    return;
  }

  if (options.to < options.from) {
    throw new ValidationError('to must be greater than or equal to from', 'to');
  }

  if (options.to - options.from + 1 > 300) {
    throw new ValidationError('hadith range cannot exceed 300 items', 'to');
  }
}

export function validatePrayerOptions(options: PrayerLocationOptions): void {
  if (options.date !== undefined) {
    validateDate(options.date);
  }

  const hasLatitude = options.latitude !== undefined;
  const hasLongitude = options.longitude !== undefined;
  const hasCity = options.city !== undefined;
  const hasCountry = options.country !== undefined;

  if (hasLatitude || hasLongitude) {
    if (!hasLatitude || !hasLongitude) {
      throw new ValidationError(
        'latitude and longitude must be provided together',
        hasLatitude ? 'longitude' : 'latitude',
      );
    }

    validateLatitude(options.latitude as number);
    validateLongitude(options.longitude as number);
    return;
  }

  if (hasCity || hasCountry) {
    if (!hasCity || !hasCountry) {
      throw new ValidationError('city and country must be provided together', hasCity ? 'country' : 'city');
    }

    validateNonEmptyString('city', options.city as string);
    validateNonEmptyString('country', options.country as string);
    return;
  }

  throw new ValidationError('provide either latitude/longitude or city/country', 'location');
}