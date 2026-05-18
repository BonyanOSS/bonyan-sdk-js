import { ApiError, BonyanApiError, BonyanRequestError, NetworkError, ValidationError } from './errors.js';
import { HttpClient } from './http.js';
import { AyatResource } from './resources/ayat.js';
import { AzkarResource } from './resources/azkar.js';
import { HadithResource } from './resources/hadith.js';
import { HijriResource } from './resources/hijri.js';
import { PrayerResource } from './resources/prayer.js';
import { QiblaResource } from './resources/qibla.js';
import { RecitersResource } from './resources/reciters.js';
import { SurahResource } from './resources/surah.js';
import { TafsirResource } from './resources/tafsir.js';
import type { BonyanClientOptions } from './types.js';

export const DEFAULT_BASE_URL = 'https://api.bonyanoss.org/bonyan-api/v1';
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRY = 3;

export default class BonyanClient {
  readonly ayat: AyatResource;
  readonly surah: SurahResource;
  readonly azkar: AzkarResource;
  readonly hadith: HadithResource;
  readonly tafsir: TafsirResource;
  readonly prayer: PrayerResource;
  readonly hijri: HijriResource;
  readonly qibla: QiblaResource;
  readonly reciters: RecitersResource;

  private readonly http: HttpClient;

  constructor(options: BonyanClientOptions = {}) {
    this.http = new HttpClient({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retry: options.retry ?? DEFAULT_RETRY,
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });

    this.ayat = new AyatResource(this.http);
    this.surah = new SurahResource(this.http);
    this.azkar = new AzkarResource(this.http);
    this.hadith = new HadithResource(this.http);
    this.tafsir = new TafsirResource(this.http);
    this.prayer = new PrayerResource(this.http);
    this.hijri = new HijriResource(this.http);
    this.qibla = new QiblaResource(this.http);
    this.reciters = new RecitersResource(this.http);
  }

  request<T>(path: string, options?: RequestInit): Promise<T> {
    return this.http.get<T>(path, options);
  }

  health(options?: RequestInit): Promise<{ status: string; code: number; timestamp: string }> {
    return this.http.get('/health', options);
  }
}

export function createBonyanClient(options?: BonyanClientOptions): BonyanClient {
  return new BonyanClient(options);
}

export { ApiError, BonyanApiError, BonyanRequestError, NetworkError, ValidationError };