import type { HttpClient } from '../http.js';
import type { SurahItem } from '../types.js';
import { validateNonEmptyString, validateSurah } from '../validation.js';

export class SurahResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<{ surah: SurahItem[] }> {
    return this.http.get('/surah');
  }

  getById(id: number): Promise<SurahItem> {
    validateSurah(id);
    return this.http.get(`/surah/${id}`);
  }

  search(name: string): Promise<SurahItem[]> {
    validateNonEmptyString('name', name);
    return this.http.get('/surah/search', { query: { name } });
  }
}