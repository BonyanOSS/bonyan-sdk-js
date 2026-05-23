import type { HijriDate } from '../types.js';
import { ensureDate } from '../validation.js';
import { BaseResource } from './base.js';

/**
 * Endpoints under `/hijri` — convert between Hijri and Gregorian dates.
 *
 * Dates use the **`DD-MM-YYYY`** format.
 *
 * @example
 * ```ts
 * const today = await client.hijri.today();
 * const fromGregorian = await client.hijri.fromGregorian('01-01-2026');
 * const toGregorian = await client.hijri.toGregorian('15-06-1447');
 * ```
 */
export class HijriResource extends BaseResource {
  /** `GET /hijri/today` — today's date in both calendars. */
  async today(): Promise<HijriDate> {
    return this.http.get<HijriDate>('/hijri/today');
  }

  /** `GET /hijri/from-gregorian?date=DD-MM-YYYY` — convert a Gregorian date to Hijri. */
  async fromGregorian(date?: string): Promise<HijriDate> {
    if (date !== undefined) ensureDate(date);
    return this.http.get<HijriDate>('/hijri/from-gregorian', { query: { date } });
  }

  /** `GET /hijri/to-gregorian?date=DD-MM-YYYY` — convert a Hijri date to Gregorian. */
  async toGregorian(date: string): Promise<HijriDate> {
    ensureDate(date);
    return this.http.get<HijriDate>('/hijri/to-gregorian', { query: { date } });
  }
}
