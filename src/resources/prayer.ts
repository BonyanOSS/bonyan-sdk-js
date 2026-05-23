import type { PrayerTimings } from '../types.js';
import { type PrayerLocation, ensurePrayerLocation } from '../validation.js';
import { BaseResource } from './base.js';

export type PrayerTimesOptions = PrayerLocation;

/**
 * Endpoints under `/prayer` — daily prayer timings for a location.
 *
 * Provide either `latitude` + `longitude` **or** `city` + `country`.
 *
 * @example
 * ```ts
 * const byCoords = await client.prayer.getTimes({ latitude: 21.42, longitude: 39.82 });
 * const byCity = await client.prayer.getTimes({ city: 'Mecca', country: 'SA', method: 4 });
 * ```
 */
export class PrayerResource extends BaseResource {
  /** `GET /prayer/times` — prayer timings for a given location and date. */
  getTimes(options: PrayerTimesOptions): Promise<PrayerTimings> {
    ensurePrayerLocation(options);
    return this.http.get<PrayerTimings>('/prayer/times', {
      query: {
        date: options.date,
        latitude: options.latitude,
        longitude: options.longitude,
        city: options.city,
        country: options.country,
        method: options.method,
      },
    });
  }
}
