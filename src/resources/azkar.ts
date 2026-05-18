import type { HttpClient } from '../http.js';
import type { AzkarCategory, AzkarItem } from '../types.js';
import { validateLimit, validateNonEmptyString } from '../validation.js';

export interface AzkarSearchOptions {
  limit?: number;
}

export interface AzkarSearchResult {
  success: true;
  total: number;
  data: Array<{ category: string; item: { id: number; text: string; count?: number } }>;
}

export class AzkarResource {
  constructor(private readonly http: HttpClient) {}

  categories(): Promise<{ categories: { name: string; count: number; apiName: string }[] }> {
    return this.http.get('/azkar');
  }

  getByCategory(category: string): Promise<AzkarCategory> {
    validateNonEmptyString('category', category);
    return this.http.get(`/azkar/${encodeURIComponent(category)}`);
  }

  search(text: string, options?: AzkarSearchOptions): Promise<AzkarSearchResult> {
    validateNonEmptyString('text', text);
    validateLimit(options?.limit, 200);
    return this.http.get('/azkar/search', { query: { text, limit: options?.limit }, unwrap: false });
  }

  random(): Promise<{ category: string; item: AzkarItem }> {
    return this.http.get('/azkar/random');
  }
}