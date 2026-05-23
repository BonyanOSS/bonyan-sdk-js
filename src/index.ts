// Client — use the named export (`import { BonyanClient } from '...'`).
// A default export is intentionally avoided to keep CJS / ESM interop clean.
export {
  BonyanClient,
  createBonyanClient,
  DEFAULT_BASE_URL,
  DEFAULT_RETRY,
  DEFAULT_TIMEOUT_MS,
} from './client.js';

// Errors
export {
  BonyanApiError,
  BonyanRequestError,
  ValidationError,
  isBonyanApiError,
  isBonyanRequestError,
  isValidationError,
} from './errors.js';

// Resources (for type-only imports and advanced composition)
export { BaseResource } from './resources/base.js';
export { AyatResource, type AyatSearchOptions } from './resources/ayat.js';
export { AzkarResource, type AzkarSearchOptions } from './resources/azkar.js';
export { HadithResource, type HadithBookOptions, type HadithRandomOptions } from './resources/hadith.js';
export { HijriResource } from './resources/hijri.js';
export { PrayerResource, type PrayerTimesOptions } from './resources/prayer.js';
export { QiblaResource } from './resources/qibla.js';
export { RecitersResource } from './resources/reciters.js';
export { SurahResource } from './resources/surah.js';
export { TafsirResource, type TafsirSurahOptions } from './resources/tafsir.js';

// Public types
export type * from './types.js';
