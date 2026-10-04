import type { BonyanRequestOptions } from '../http.js';
import type { AzkarCategory, AzkarCategorySummary, AzkarSearchHit, AzkarSearchResult } from '../types.js';
import { ensureLimit, ensureNonEmptyString } from '../validation.js';
import { BaseResource } from './base.js';

interface AzkarCategoriesEnvelope {
  categories: AzkarCategorySummary[];
}

export interface AzkarSearchOptions {
  /** Maximum number of matches to return. 1 ≤ limit ≤ 200 (defaults to 50 server-side). */
  limit?: number;
}

/**
 * Endpoints under `/azkar` — daily supplications grouped by category.
 *
 * @example
 * ```ts
 * const categories = await client.azkar.listCategories();
 * const morning   = await client.azkar.getByCategory('أذكار الصباح');
 * const matches   = await client.azkar.search('استغفر', { limit: 10 });
 * const random    = await client.azkar.random();
 * ```
 */
export class AzkarResource extends BaseResource {
  /** `GET /azkar` — list every category with item counts. */
  async listCategories(request: BonyanRequestOptions = {}): Promise<AzkarCategorySummary[]> {
    const data = await this.http.get<AzkarCategoriesEnvelope>('/azkar', request);
    return data.categories;
  }

  /** `GET /azkar/:category` — fetch every zikr in a category. */
  async getByCategory(category: string, request: BonyanRequestOptions = {}): Promise<AzkarCategory> {
    ensureNonEmptyString('category', category);
    return this.http.get<AzkarCategory>(`/azkar/${encodeURIComponent(category)}`, request);
  }

  /** `GET /azkar/search?text=…` — full-text search across all azkar. */
  async search(
    text: string,
    options: AzkarSearchOptions = {},
    request: BonyanRequestOptions = {},
  ): Promise<AzkarSearchResult> {
    ensureNonEmptyString('text', text);
    ensureLimit(options.limit, 200);
    return this.http.search<AzkarSearchHit>('/azkar/search', {
      ...request,
      query: { text, limit: options.limit },
    });
  }

  /** `GET /azkar/random` — return a random zikr from any category. */
  async random(request: BonyanRequestOptions = {}): Promise<AzkarSearchHit> {
    return this.http.get<AzkarSearchHit>('/azkar/random', request);
  }
}
