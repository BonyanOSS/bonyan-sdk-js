import type { BonyanRequestOptions } from '../http.js';
import type { Reciter, ReciterAudio } from '../types.js';
import { ensureNonEmptyString, ensurePositiveInteger, ensureSurahNumber } from '../validation.js';
import { BaseResource } from './base.js';

interface RecitersListEnvelope {
  reciters: Reciter[];
}

export interface ReciterAudioOptions {
  /** Recording ID from the reciter's moshaf catalogue. Omitted prefers a covering Hafs murattal recording, then another covering recording. */
  moshaf?: number;
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
  async list(request: BonyanRequestOptions = {}): Promise<Reciter[]> {
    const data = await this.http.get<RecitersListEnvelope>('/reciters', request);
    return data.reciters;
  }

  /** `GET /reciters/:id` — fetch a single reciter by numeric id. */
  async getById(id: number, request: BonyanRequestOptions = {}): Promise<Reciter> {
    ensurePositiveInteger('id', id);
    return this.http.get<Reciter>(`/reciters/${id}`, request);
  }

  /** `GET /reciters/search?name=…` - normalized Arabic substring search. */
  async search(name: string, request: BonyanRequestOptions = {}): Promise<Reciter[]> {
    ensureNonEmptyString('name', name);
    return this.http.get<Reciter[]>('/reciters/search', { ...request, query: { name } });
  }

  /** `GET /reciters/:id/surah/:surah` — direct audio URL for one reciter+surah. */
  async getSurah(
    reciterId: number,
    surah: number,
    options: ReciterAudioOptions = {},
    request: BonyanRequestOptions = {},
  ): Promise<ReciterAudio> {
    ensurePositiveInteger('reciterId', reciterId);
    ensureSurahNumber(surah);
    if (options.moshaf !== undefined) ensurePositiveInteger('moshaf', options.moshaf);
    return this.http.get<ReciterAudio>(`/reciters/${reciterId}/surah/${surah}`, {
      ...request,
      query: { moshaf: options.moshaf },
    });
  }
}
