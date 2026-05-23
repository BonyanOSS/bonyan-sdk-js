/**
 * Type definitions for the Bonyan-API SDK.
 *
 * Types are grouped by domain (client, envelope, resources). See the README
 * and individual resource files for usage examples.
 */

// ─── Client ──────────────────────────────────────────────────────────────────

export type BonyanFetch = typeof fetch;

export interface BonyanClientOptions {
  /** Base URL of the Bonyan-API. Defaults to the official endpoint. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 10 seconds. */
  timeoutMs?: number;
  /** Number of retry attempts on 5xx / 429 / network errors. Defaults to 3. */
  retry?: number;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
  /** Custom fetch implementation (Node < 18, undici, etc). */
  fetch?: BonyanFetch;
  /** Optional User-Agent header. */
  userAgent?: string;
}

// ─── Envelope ────────────────────────────────────────────────────────────────

export interface BonyanSuccessBody<T> {
  success: true;
  data: T;
}

export type BonyanErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'ALL_SOURCES_FAILED'
  | 'INTERNAL_SERVER_ERROR'
  | (string & {});

export interface BonyanErrorBody {
  success: false;
  message?: string;
  error?: {
    code?: BonyanErrorCode;
    message?: string;
    requestId?: string;
  };
}

// ─── API sources ─────────────────────────────────────────────────────────────

export type SurahApiSource = 'mp3quran.net' | 'alquran.cloud' | 'quran.com';
export type ReciterApiSource = 'mp3quran.net' | 'quran.com';
export type AyatApiSource = 'alquran.cloud' | 'cdn.jsdelivr.net/fawazahmed0/quran-api';
export type AzkarApiSource = 'hisnmuslim.com' | 'github.com/nawafalqari';
export type TafsirApiSource = 'alquran.cloud' | 'quranenc.com';
export type HadithApiSource = 'hadith.gading.dev' | 'cdn.jsdelivr.net/sutanlab/hadith-api';
export type PrayerApiSource = 'aladhan.com' | 'pray.zone';
export type HijriApiSource = 'aladhan.com';
export type QiblaApiSource = 'aladhan.com';

// ─── Reciters ────────────────────────────────────────────────────────────────

export interface ReciterMoshaf {
  id: number;
  name: string;
  server: string;
}

export interface Reciter {
  id: number;
  name: string;
  date?: string;
  moshaf?: ReciterMoshaf[];
  style?: string | null;
  apiName: ReciterApiSource;
}

export interface ReciterAudio {
  reciter: string;
  surah: number;
  audio: string;
}

// ─── Surah ───────────────────────────────────────────────────────────────────

export interface Surah {
  id: number;
  name: string;
  makkia?: boolean;
  apiName: SurahApiSource;
}

// ─── Ayat ────────────────────────────────────────────────────────────────────

export interface Aya {
  number: number;
  text: string;
  numberInSurah: number;
}

export interface SurahWithAyat {
  number: number;
  name: string;
  ayat: Aya[];
  apiName: AyatApiSource;
}

export interface AyaWithSurah {
  surahNumber: number;
  surahName: string;
  aya: Aya;
}

export interface AyatSearchResult {
  total: number;
  results: AyaWithSurah[];
}

// ─── Azkar ───────────────────────────────────────────────────────────────────

export interface AzkarItem {
  id: number;
  text: string;
  count?: number;
  reference?: string;
  description?: string;
  content?: string;
}

export interface AzkarCategorySummary {
  name: string;
  count: number;
  apiName: AzkarApiSource;
}

export interface AzkarCategory {
  category: string;
  items: AzkarItem[];
  apiName: AzkarApiSource;
}

export interface AzkarSearchHit {
  category: string;
  item: AzkarItem;
}

export interface AzkarSearchResult {
  total: number;
  results: AzkarSearchHit[];
}

// ─── Tafsir ──────────────────────────────────────────────────────────────────

export interface TafsirEdition {
  id: string;
  label: string;
}

export interface TafsirItem {
  surah: number;
  aya: number;
  text: string;
  edition: string;
  apiName: TafsirApiSource;
}

// ─── Hadith ──────────────────────────────────────────────────────────────────

export interface HadithBook {
  id: string;
  name: string;
  available: number;
  apiName: HadithApiSource;
}

export interface HadithItem {
  number: number;
  text: string;
  book: string;
  apiName: HadithApiSource;
}

export interface HadithBookContent {
  book: string;
  available: number;
  hadiths: HadithItem[];
}

export interface HadithRandomResult {
  book: string;
  hadith: HadithItem;
}

// ─── Prayer ──────────────────────────────────────────────────────────────────

export interface PrayerTimings {
  date: string;
  hijri?: string;
  timings: {
    Fajr: string;
    Sunrise?: string;
    Dhuhr: string;
    Asr: string;
    Sunset?: string;
    Maghrib: string;
    Isha: string;
    Imsak?: string;
    Midnight?: string;
  };
  method?: string;
  coordinates?: { latitude: number; longitude: number };
  apiName: PrayerApiSource;
}

// ─── Hijri ───────────────────────────────────────────────────────────────────

export interface HijriDate {
  hijri: {
    date: string;
    day: string;
    month: string;
    monthAr: string;
    year: string;
    weekday: string;
    weekdayAr: string;
  };
  gregorian: { date: string; day: string; month: string; year: string };
  apiName: HijriApiSource;
}

// ─── Qibla ───────────────────────────────────────────────────────────────────

export interface QiblaInfo {
  latitude: number;
  longitude: number;
  direction: number;
  apiName: QiblaApiSource;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  code: number;
  timestamp: string;
}
