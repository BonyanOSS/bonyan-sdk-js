import type { HttpClient } from '../http.js';
import type { TafsirItem } from '../types.js';
import { validateNonEmptyString, validatePositiveInteger, validateSurah } from '../validation.js';

export interface TafsirSurahOptions {
  aya?: number;
}

export class TafsirResource {
  constructor(private readonly http: HttpClient) {}

  listEditions(): Promise<{ id: string; label: string }[]> {
    return this.http.get('/tafsir');
  }

  forSurah(edition: string, surah: number, options?: TafsirSurahOptions): Promise<TafsirItem[] | TafsirItem> {
    validateNonEmptyString('edition', edition);
    validateSurah(surah);

    if (options?.aya !== undefined) validatePositiveInteger('aya', options.aya);
    return this.http.get(`/tafsir/${encodeURIComponent(edition)}/${surah}`, { query: { aya: options?.aya } });
  }

  forAya(edition: string, surah: number, aya: number): Promise<TafsirItem> {
    validateNonEmptyString('edition', edition);
    validateSurah(surah);
    validatePositiveInteger('aya', aya);
    return this.http.get(`/tafsir/${encodeURIComponent(edition)}/${surah}/${aya}`);
  }
}