import type { HadithBook, HadithBookContent, HadithItem, HadithRandomResult } from '../types.js';
import { ensureHadithRange, ensureNonEmptyString, ensurePositiveInteger } from '../validation.js';
import { BaseResource } from './base.js';

export interface HadithBookOptions {
  /** Inclusive start of the hadith range. */
  from?: number;
  /** Inclusive end of the hadith range. */
  to?: number;
}

export interface HadithRandomOptions {
  /** Restrict the random pick to a single book id. */
  book?: string;
}

/**
 * Endpoints under `/hadith` — collections of authenticated narrations.
 *
 * @example
 * ```ts
 * const books = await client.hadith.listBooks();
 * const arbain = await client.hadith.getBook('arbain', { from: 1, to: 10 });
 * const one = await client.hadith.getByNumber('bukhari', 1);
 * const random = await client.hadith.random({ book: 'muslim' });
 * ```
 */
export class HadithResource extends BaseResource {
  /** `GET /hadith` — list available hadith books. */
  async listBooks(): Promise<HadithBook[]> {
    return this.http.get<HadithBook[]>('/hadith');
  }

  /** `GET /hadith/:book` — fetch a slice of hadiths from a book (max 300 at a time). */
  async getBook(bookId: string, options: HadithBookOptions = {}): Promise<HadithBookContent> {
    ensureNonEmptyString('bookId', bookId);
    ensureHadithRange(options);
    return this.http.get<HadithBookContent>(`/hadith/${encodeURIComponent(bookId)}`, {
      query: { from: options.from, to: options.to },
    });
  }

  /** `GET /hadith/:book/:number` — fetch a single hadith by its number in the book. */
  async getByNumber(bookId: string, number: number): Promise<HadithItem> {
    ensureNonEmptyString('bookId', bookId);
    ensurePositiveInteger('number', number);
    return this.http.get<HadithItem>(`/hadith/${encodeURIComponent(bookId)}/${number}`);
  }

  /** `GET /hadith/random` — pick a random hadith, optionally constrained to one book. */
  async random(options: HadithRandomOptions = {}): Promise<HadithRandomResult> {
    if (options.book !== undefined) ensureNonEmptyString('book', options.book);
    return this.http.get<HadithRandomResult>('/hadith/random', {
      query: { book: options.book },
    });
  }
}
