export type BonyanFetch = typeof fetch;

export interface BonyanClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  retry?: number;
  fetch?: BonyanFetch;
}

export type SurahApiSource = 'mp3quran.net' | 'alquran.cloud' | 'quran.com';
export type ReciterApiSource = 'mp3quran.net' | 'quran.com';
export type AyatApiSource = 'alquran.cloud' | 'cdn.jsdelivr.net/fawazahmed0/quran-api';
export type AzkarApiSource = 'hisnmuslim.com' | 'github.com/nawafalqari';
export type TafsirApiSource = 'alquran.cloud' | 'quranenc.com';
export type HadithApiSource = 'hadith.gading.dev' | 'cdn.jsdelivr.net/sutanlab/hadith-api';
export type PrayerApiSource = 'aladhan.com' | 'pray.zone';
export type HijriApiSource = 'aladhan.com';
export type QiblaApiSource = 'aladhan.com'

export interface ReciterItem {
  id: number;
  name: string;
  date?: string;
  moshaf?: {
    id: number;
    name: string;
    server: string;
  }[];
  style?: string | null;
  apiName: ReciterApiSource;
}

export interface SurahItem {
  id: number;
  name: string;
  makkia?: boolean;
  apiName: SurahApiSource;
}

export interface AyaItem {
  number: number;
  text: string;
  numberInSurah: number;
}

export interface SurahWithAyaItem {
  number: number;
  name: string;
  ayat: AyaItem[];
  apiName: AyatApiSource;
}

export interface AzkarItem {
  id: number;
  text: string;
  count?: number;
  reference?: string;
  description?: string;
  content?: string;
}

export interface AzkarCategory {
  category: string;
  items: AzkarItem[];
  apiName: AzkarApiSource;
}

export interface TafsirItem {
  surah: number;
  aya: number;
  text: string;
  edition: string;
  apiName: TafsirApiSource;
}

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

export interface QiblaInfo {
  latitude: number;
  longitude: number;
  direction: number;
  apiName: QiblaApiSource;
}

export type Reciter = ReciterItem;
export type ReciterAudio = { reciter: string; surah: number; audio: string };
export type ReciterMoshaf = NonNullable<ReciterItem['moshaf']>[number];
export type ReciterSource = ReciterApiSource;

export type BonyanErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'ALL_SOURCES_FAILED' | 'INTERNAL_ERROR' | string;

export interface BonyanErrorBody {
  success: false;
  message?: string;
  error?: {
    code?: BonyanErrorCode;
    message?: string;
    requestId?: string;
  };
}

export interface BonyanSuccessBody<T> {
  success: true;
  data: T;
}
