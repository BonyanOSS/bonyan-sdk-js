import type { AyaWithSurah, AyatSearchResult, SurahWithAyat } from '../types.js';
import {
  TOTAL_AYAT,
  ensureAyaNumber,
  ensureIntegerInRange,
  ensureLimit,
  ensureNonEmptyString,
  ensureSurahNumber,
} from '../validation.js';
import { BaseResource } from './base.js';

interface AyatListEnvelope {
  surahs: SurahWithAyat[];
}

interface AyatSearchEnvelope {
  total: number;
  data: AyaWithSurah[];
}

export interface AyatSearchOptions {
  /** Maximum number of matches to return. 1 ≤ limit ≤ 500 (defaults to 50 server-side). */
  limit?: number;
}

/**
 * Endpoints under `/ayat` — full mushaf access plus full-text search.
 *
 * @example
 * ```ts
 * const allSurahs = await client.ayat.list();
 * const aya = await client.ayat.getById(1);
 * const verse = await client.ayat.getBySurah(2, 255); // Ayat al-Kursi
 * const matches = await client.ayat.search('الرحمن', { limit: 20 });
 * console.log(matches.total, matches.results.length);
 * ```
 */
export class AyatResource extends BaseResource {
  /** `GET /ayat` — returns all 114 surahs with their full ayat. (Heavy response.) */
  async list(): Promise<SurahWithAyat[]> {
    const data = await this.http.get<AyatListEnvelope>('/ayat');
    return data.surahs;
  }

  /** `GET /ayat/:id` — fetch an aya by its global number (1-6236). */
  async getById(id: number): Promise<AyaWithSurah> {
    ensureIntegerInRange('id', id, 1, TOTAL_AYAT);
    return this.http.get<AyaWithSurah>(`/ayat/${id}`);
  }

  /** `GET /ayat/:surah/aya/:aya` — fetch an aya by surah number and verse number. */
  async getBySurah(surah: number, aya: number): Promise<AyaWithSurah> {
    ensureSurahNumber(surah);
    ensureAyaNumber(aya);
    return this.http.get<AyaWithSurah>(`/ayat/${surah}/aya/${aya}`);
  }

  /** `GET /ayat/search?text=…` — full-text search across the mushaf. */
  async search(text: string, options: AyatSearchOptions = {}): Promise<AyatSearchResult> {
    ensureNonEmptyString('text', text);
    ensureLimit(options.limit, 500);
    const envelope = await this.http.get<AyatSearchEnvelope>('/ayat/search', {
      query: { text, limit: options.limit },
    });
    return { total: envelope.total, results: envelope.data };
  }
}
