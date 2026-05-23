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
import type { BonyanClientOptions, HealthStatus } from './types.js';

/** Official Bonyan-API endpoint. */
export const DEFAULT_BASE_URL = 'https://api.bonyanoss.org';
/** Default per-request timeout (10 seconds). */
export const DEFAULT_TIMEOUT_MS = 10_000;
/** Default retry attempts for transient errors (5xx, 429, network). */
export const DEFAULT_RETRY = 3;

/**
 * Bonyan-API client. One instance gives access to every resource.
 *
 * @example
 * ```ts
 * import { BonyanClient } from '@bonyanoss/bonyan-api';
 *
 * const client = new BonyanClient();
 *
 * const reciters = await client.reciters.list();
 * const fatiha = await client.surah.getById(1);
 * const azkar = await client.azkar.random();
 * ```
 */
export class BonyanClient {
  readonly ayat: AyatResource;
  readonly azkar: AzkarResource;
  readonly hadith: HadithResource;
  readonly hijri: HijriResource;
  readonly prayer: PrayerResource;
  readonly qibla: QiblaResource;
  readonly reciters: RecitersResource;
  readonly surah: SurahResource;
  readonly tafsir: TafsirResource;

  private readonly http: HttpClient;

  constructor(options: BonyanClientOptions = {}) {
    this.http = new HttpClient({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retry: options.retry ?? DEFAULT_RETRY,
      ...(options.headers && { headers: options.headers }),
      ...(options.fetch && { fetch: options.fetch }),
      ...(options.userAgent && { userAgent: options.userAgent }),
    });

    this.ayat = new AyatResource(this.http);
    this.azkar = new AzkarResource(this.http);
    this.hadith = new HadithResource(this.http);
    this.hijri = new HijriResource(this.http);
    this.prayer = new PrayerResource(this.http);
    this.qibla = new QiblaResource(this.http);
    this.reciters = new RecitersResource(this.http);
    this.surah = new SurahResource(this.http);
    this.tafsir = new TafsirResource(this.http);
  }

  /** `GET /health` — liveness probe. */
  health(): Promise<HealthStatus> {
    return this.http.raw<HealthStatus>('/health');
  }
}

/** Convenience factory — equivalent to `new BonyanClient(options)`. */
export function createBonyanClient(options?: BonyanClientOptions): BonyanClient {
  return new BonyanClient(options);
}

export default BonyanClient;
