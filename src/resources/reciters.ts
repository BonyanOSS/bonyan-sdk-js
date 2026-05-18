import type { HttpClient } from '../http.js';
import type { ReciterItem } from '../types.js';
import { validateNonEmptyString, validatePositiveInteger, validateSurah } from '../validation.js';

export interface ReciterAudio {
  reciter: string;
  surah: number;
  audio: string;
}

export class RecitersResource {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<{ reciters: ReciterItem[] }> {
    return this.http.get('/reciters');
  }

  getById(id: number): Promise<ReciterItem> {
    validatePositiveInteger('id', id);
    return this.http.get(`/reciters/${id}`);
  }

  search(name: string): Promise<ReciterItem[]> {
    validateNonEmptyString('name', name);
    return this.http.get('/reciters/search', { query: { name } });
  }

  getSurah(reciterId: number, surah: number): Promise<ReciterAudio> {
    validatePositiveInteger('reciterId', reciterId);
    validateSurah(surah);
    return this.http.get(`/reciters/${reciterId}/surah/${surah}`);
  }
}