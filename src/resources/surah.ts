import type { BonyanRequestOptions } from '../http.js';
import type { Surah } from '../types.js';
import { ensureNonEmptyString, ensureSurahNumber } from '../validation.js';
import { BaseResource } from './base.js';

interface SurahListEnvelope {
  surah: Surah[];
}

/**
 * Endpoints under `/surah` — the 114 chapters of the Quran.
 *
 * @example
 * ```ts
 * const all = await client.surah.list();        // 114 chapters
 * const fatiha = await client.surah.getById(1); // Al-Fatiha
 * const matches = await client.surah.search('البقرة');
 * ```
 */
export class SurahResource extends BaseResource {
  /** `GET /surah` — returns the full list of surahs. */
  async list(request: BonyanRequestOptions = {}): Promise<Surah[]> {
    const data = await this.http.get<SurahListEnvelope>('/surah', request);
    return data.surah;
  }

  /** `GET /surah/:id` — fetch a surah by its number (1-114). */
  async getById(id: number, request: BonyanRequestOptions = {}): Promise<Surah> {
    ensureSurahNumber(id);
    return this.http.get<Surah>(`/surah/${id}`, request);
  }

  /** `GET /surah/search?name=…` — search a surah by normalized Arabic name. */
  async search(name: string, request: BonyanRequestOptions = {}): Promise<Surah[]> {
    ensureNonEmptyString('name', name);
    return this.http.get<Surah[]>('/surah/search', { ...request, query: { name } });
  }
}
