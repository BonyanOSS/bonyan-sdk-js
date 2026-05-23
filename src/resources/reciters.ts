import type { Reciter, ReciterAudio } from '../types.js';
import { ensureNonEmptyString, ensurePositiveInteger, ensureSurahNumber } from '../validation.js';
import { BaseResource } from './base.js';

interface RecitersListEnvelope {
  reciters: Reciter[];
}

/**
 * Endpoints under `/reciters` — list, lookup, search and per-surah audio.
 *
 * @example
 * ```ts
 * const all = await client.reciters.list();
 * const reciter = await client.reciters.getById(1);
 * const matches = await client.reciters.search('العفاسي');
 * const audio = await client.reciters.getSurah(1, 1);
 * ```
 */
export class RecitersResource extends BaseResource {
  /** `GET /reciters` — returns every reciter known to the API. */
  async list(): Promise<Reciter[]> {
    const data = await this.http.get<RecitersListEnvelope>('/reciters');
    return data.reciters;
  }

  /** `GET /reciters/:id` — fetch a single reciter by numeric id. */
  getById(id: number): Promise<Reciter> {
    ensurePositiveInteger('id', id);
    return this.http.get<Reciter>(`/reciters/${id}`);
  }

  /** `GET /reciters/search?name=…` — fuzzy search by reciter name (Arabic or English). */
  search(name: string): Promise<Reciter[]> {
    ensureNonEmptyString('name', name);
    return this.http.get<Reciter[]>('/reciters/search', { query: { name } });
  }

  /** `GET /reciters/:id/surah/:surah` — direct audio URL for one reciter+surah. */
  getSurah(reciterId: number, surah: number): Promise<ReciterAudio> {
    ensurePositiveInteger('reciterId', reciterId);
    ensureSurahNumber(surah);
    return this.http.get<ReciterAudio>(`/reciters/${reciterId}/surah/${surah}`);
  }
}
