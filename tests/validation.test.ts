import { describe, expect, it } from 'vitest';
import { ValidationError } from '../src/index.js';
import {
  ensureAyaNumber,
  ensureDate,
  ensureHadithRange,
  ensureLatitude,
  ensureLimit,
  ensureLongitude,
  ensureNonEmptyString,
  ensurePositiveInteger,
  ensurePrayerLocation,
  ensureSurahNumber,
} from '../src/validation.js';

describe('validation', () => {
  it('ensureSurahNumber accepts 1-114, rejects outside', () => {
    expect(() => ensureSurahNumber(1)).not.toThrow();
    expect(() => ensureSurahNumber(114)).not.toThrow();
    expect(() => ensureSurahNumber(0)).toThrow(ValidationError);
    expect(() => ensureSurahNumber(115)).toThrow(ValidationError);
    expect(() => ensureSurahNumber(1.5)).toThrow(ValidationError);
  });

  it('ensureAyaNumber accepts 1-6236', () => {
    expect(() => ensureAyaNumber(1)).not.toThrow();
    expect(() => ensureAyaNumber(6236)).not.toThrow();
    expect(() => ensureAyaNumber(6237)).toThrow(ValidationError);
  });

  it('ensurePositiveInteger rejects 0 and negatives', () => {
    expect(() => ensurePositiveInteger('id', 1)).not.toThrow();
    expect(() => ensurePositiveInteger('id', 0)).toThrow();
    expect(() => ensurePositiveInteger('id', -1)).toThrow();
  });

  it('ensureNonEmptyString rejects empty and whitespace', () => {
    expect(() => ensureNonEmptyString('q', 'hi')).not.toThrow();
    expect(() => ensureNonEmptyString('q', '')).toThrow();
    expect(() => ensureNonEmptyString('q', '   ')).toThrow();
  });

  it('ensureLimit is optional but bounded when provided', () => {
    expect(() => ensureLimit(undefined, 100)).not.toThrow();
    expect(() => ensureLimit(1, 100)).not.toThrow();
    expect(() => ensureLimit(100, 100)).not.toThrow();
    expect(() => ensureLimit(101, 100)).toThrow();
    expect(() => ensureLimit(0, 100)).toThrow();
  });

  it('ensureDate requires DD-MM-YYYY', () => {
    expect(() => ensureDate('01-01-2026')).not.toThrow();
    expect(() => ensureDate('2026-01-01')).toThrow();
    expect(() => ensureDate('1-1-2026')).toThrow();
  });

  it('ensureLatitude bounded to [-90, 90]', () => {
    expect(() => ensureLatitude(0)).not.toThrow();
    expect(() => ensureLatitude(-90)).not.toThrow();
    expect(() => ensureLatitude(91)).toThrow();
    expect(() => ensureLatitude(Number.NaN)).toThrow();
  });

  it('ensureLongitude bounded to [-180, 180]', () => {
    expect(() => ensureLongitude(0)).not.toThrow();
    expect(() => ensureLongitude(181)).toThrow();
  });

  it('ensureHadithRange enforces ordering and max 300', () => {
    expect(() => ensureHadithRange({ from: 1, to: 10 })).not.toThrow();
    expect(() => ensureHadithRange({ from: 10, to: 1 })).toThrow();
    expect(() => ensureHadithRange({ from: 1, to: 301 })).toThrow();
    expect(() => ensureHadithRange()).not.toThrow();
  });

  it('ensurePrayerLocation requires coords-pair or city-pair', () => {
    expect(() => ensurePrayerLocation({ latitude: 21, longitude: 39 })).not.toThrow();
    expect(() => ensurePrayerLocation({ city: 'Mecca', country: 'SA' })).not.toThrow();
    expect(() => ensurePrayerLocation({ latitude: 21 })).toThrow(/together/);
    expect(() => ensurePrayerLocation({ city: 'Mecca' })).toThrow(/together/);
    expect(() => ensurePrayerLocation({})).toThrow(/either/);
  });

  it('ValidationError exposes the field name', () => {
    try {
      ensureSurahNumber(0);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('surah');
    }
  });
});
