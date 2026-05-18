import type { HttpClient } from '../http.js';
import type { HadithBook, HadithItem } from '../types.js';
import { validateHadithRange, validateNonEmptyString, validatePositiveInteger } from '../validation.js';

export interface HadithBookOptions {
  from?: number;
  to?: number;
}

export interface HadithRandomOptions {
  book?: string;
}

export class HadithResource {
  constructor(private readonly http: HttpClient) {}

  listBooks(): Promise<HadithBook[]> {
    return this.http.get('/hadith');
  }

  getBook(bookId: string, options?: HadithBookOptions,): Promise<{ book: string; available: number; hadiths: HadithItem[] }> {
    validateNonEmptyString('bookId', bookId);
    validateHadithRange(options);
    return this.http.get(`/hadith/${encodeURIComponent(bookId)}`, { query: { from: options?.from, to: options?.to } });
  }

  getByNumber(bookId: string, number: number): Promise<HadithItem> {
    validateNonEmptyString('bookId', bookId);
    validatePositiveInteger('number', number);
    return this.http.get(`/hadith/${encodeURIComponent(bookId)}/${number}`);
  }

  random(options?: HadithRandomOptions): Promise<{ book: string; hadith: HadithItem }> {
    if (options?.book !== undefined) {
      validateNonEmptyString('book', options.book);
    }

    return this.http.get('/hadith/random', { query: { book: options?.book } });
  }
}