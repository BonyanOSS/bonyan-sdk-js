import type { HttpClient } from '../http.js';
import type { PrayerTimings } from '../types.js';
import { type PrayerLocationOptions, validatePrayerOptions } from '../validation.js';

export type PrayerTimesOptions = PrayerLocationOptions;

export class PrayerResource {
  constructor(private readonly http: HttpClient) {}

  getTimes(options: PrayerTimesOptions): Promise<PrayerTimings> {
    validatePrayerOptions(options);
    return this.http.get('/prayer/times', {
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
