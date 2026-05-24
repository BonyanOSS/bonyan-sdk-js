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
  async list(): Promise<Surah[]> {
    const data = await this.http.get<SurahListEnvelope>('/surah');
    return data.surah;
  }

  /** `GET /surah/:id` — fetch a surah by its number (1-114). */
  async getById(id: number): Promise<Surah> {
    ensureSurahNumber(id);
    return this.http.get<Surah>(`/surah/${id}`);
  }

  /** `GET /surah/search?name=…` — search a surah by name (Arabic or English). */
  async search(name: string): Promise<Surah[]> {
    ensureNonEmptyString('name', name);
    return this.http.get<Surah[]>('/surah/search', { query: { name } });
  }
}
