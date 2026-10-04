import type { BonyanRequestOptions } from '../http.js';
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
  async list(request: BonyanRequestOptions = {}): Promise<SurahWithAyat[]> {
    const data = await this.http.get<AyatListEnvelope>('/ayat', request);
    return data.surahs;
  }

  /** `GET /ayat/:id` — fetch an aya by its global number (1-6236). */
  async getById(id: number, request: BonyanRequestOptions = {}): Promise<AyaWithSurah> {
    ensureIntegerInRange('id', id, 1, TOTAL_AYAT);
    return this.http.get<AyaWithSurah>(`/ayat/${id}`, request);
  }

  /** `GET /ayat/:surah/aya/:aya` — fetch an aya by surah number and verse number. */
  async getBySurah(surah: number, aya: number, request: BonyanRequestOptions = {}): Promise<AyaWithSurah> {
    ensureSurahNumber(surah);
    ensureAyaNumber(aya);
    return this.http.get<AyaWithSurah>(`/ayat/${surah}/aya/${aya}`, request);
  }

  /** `GET /ayat/search?text=…` — full-text search across the mushaf. */
  async search(
    text: string,
    options: AyatSearchOptions = {},
    request: BonyanRequestOptions = {},
  ): Promise<AyatSearchResult> {
    ensureNonEmptyString('text', text);
    ensureLimit(options.limit, 500);
    return this.http.search<AyaWithSurah>('/ayat/search', {
      ...request,
      query: { text, limit: options.limit },
    });
  }
}
