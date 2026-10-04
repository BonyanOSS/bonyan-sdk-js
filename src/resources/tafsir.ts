import type { BonyanRequestOptions } from '../http.js';
import type { TafsirEdition, TafsirItem } from '../types.js';
import { ensureAyaNumber, ensureTafsirEdition, ensureSurahNumber } from '../validation.js';
import { BaseResource } from './base.js';

export interface TafsirSurahOptions {
  /** Restrict the response to a single aya within the surah. */
  aya?: number;
}

/**
 * Endpoints under `/tafsir` — exegesis editions and their content.
 *
 * @example
 * ```ts
 * const editions = await client.tafsir.listEditions();
 * const surah = await client.tafsir.forSurah('muyassar', 1);
 * const aya = await client.tafsir.forAya('muyassar', 1, 1);
 * ```
 */
export class TafsirResource extends BaseResource {
  /** `GET /tafsir` — list available tafsir editions. */
  async listEditions(request: BonyanRequestOptions = {}): Promise<TafsirEdition[]> {
    return this.http.get<TafsirEdition[]>('/tafsir', request);
  }

  /** `GET /tafsir/:edition/:surah` — tafsir for an entire surah (or a single aya). */
  async forSurah(
    edition: string,
    surah: number,
    options: TafsirSurahOptions = {},
    request: BonyanRequestOptions = {},
  ): Promise<TafsirItem[]> {
    ensureTafsirEdition(edition);
    ensureSurahNumber(surah);
    if (options.aya !== undefined) ensureAyaNumber(options.aya);
    return this.http.get<TafsirItem[]>(`/tafsir/${encodeURIComponent(edition)}/${surah}`, {
      ...request,
      query: { aya: options.aya },
    });
  }

  /** `GET /tafsir/:edition/:surah/:aya` — tafsir for a specific aya. */
  async forAya(
    edition: string,
    surah: number,
    aya: number,
    request: BonyanRequestOptions = {},
  ): Promise<TafsirItem> {
    ensureTafsirEdition(edition);
    ensureSurahNumber(surah);
    ensureAyaNumber(aya);
    return this.http.get<TafsirItem>(`/tafsir/${encodeURIComponent(edition)}/${surah}/${aya}`, request);
  }
}
