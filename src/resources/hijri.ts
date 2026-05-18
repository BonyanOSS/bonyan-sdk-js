import type { HttpClient } from '../http.js';
import type { HijriDate } from '../types.js';
import { validateDate } from '../validation.js';

export class HijriResource {
  constructor(private readonly http: HttpClient) {}

  today(): Promise<HijriDate> {
    return this.http.get('/hijri/today');
  }

  fromGregorian(date?: string): Promise<HijriDate> {
    if (date !== undefined) validateDate(date);
    return this.http.get('/hijri/from-gregorian', { query: { date } });
  }

  toGregorian(date: string): Promise<HijriDate> {
    validateDate(date);
    return this.http.get('/hijri/to-gregorian', { query: { date } });
  }
}
