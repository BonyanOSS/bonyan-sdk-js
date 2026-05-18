import type { HttpClient } from '../http.js';
import type { AyaItem, SurahWithAyaItem } from '../types.js';
import {
  validateIntegerRange,
  validateLimit,
  validateNonEmptyString,
  validatePositiveInteger,
  validateSurah,
} from '../validation.js';

export interface AyatSearchOptions {
  limit?: number;
}

export interface AyatSearchResult {
  success: true;
  total: number;
  data: Array<{ surahNumber: number; surahName: string; aya: AyaItem }>;
}

export class AyatResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<{ surahs: SurahWithAyaItem[] }> {
    return this.http.get('/ayat');
  }

  getById(id: number): Promise<{ surahNumber: number; surahName: string; aya: AyaItem }> {
    validateIntegerRange('id', id, 1, 6236);
    return this.http.get(`/ayat/${id}`);
  }

  getBySurah(surah: number, aya: number): Promise<{ surahNumber: number; surahName: string; aya: AyaItem }> {
    validateSurah(surah);
    validatePositiveInteger('aya', aya);
    return this.http.get(`/ayat/${surah}/aya/${aya}`);
  }

  search(text: string, options?: AyatSearchOptions): Promise<AyatSearchResult> {
    validateNonEmptyString('text', text);
    validateLimit(options?.limit, 500);
    return this.http.get('/ayat/search', { query: { text, limit: options?.limit }, unwrap: false });
  }
}