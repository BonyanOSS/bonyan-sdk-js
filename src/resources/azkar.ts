import type {
  AzkarCategory,
  AzkarCategorySummary,
  AzkarItem,
  AzkarSearchHit,
  AzkarSearchResult,
} from '../types.js';
import { ensureLimit, ensureNonEmptyString } from '../validation.js';
import { BaseResource } from './base.js';

interface AzkarCategoriesEnvelope {
  categories: AzkarCategorySummary[];
}

interface AzkarSearchEnvelope {
  total: number;
  data: AzkarSearchHit[];
}

interface AzkarRandomEnvelope {
  category: string;
  item: AzkarItem;
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
  async listCategories(): Promise<AzkarCategorySummary[]> {
    const data = await this.http.get<AzkarCategoriesEnvelope>('/azkar');
    return data.categories;
  }

  /** `GET /azkar/:category` — fetch every zikr in a category. */
  async getByCategory(category: string): Promise<AzkarCategory> {
    ensureNonEmptyString('category', category);
    return this.http.get<AzkarCategory>(`/azkar/${encodeURIComponent(category)}`);
  }

  /** `GET /azkar/search?text=…` — full-text search across all azkar. */
  async search(text: string, options: AzkarSearchOptions = {}): Promise<AzkarSearchResult> {
    ensureNonEmptyString('text', text);
    ensureLimit(options.limit, 200);
    const envelope = await this.http.get<AzkarSearchEnvelope>('/azkar/search', {
      query: { text, limit: options.limit },
    });
    return { total: envelope.total, results: envelope.data };
  }

  /** `GET /azkar/random` — return a random zikr from any category. */
  async random(): Promise<{ category: string; item: AzkarItem }> {
    return this.http.get<AzkarRandomEnvelope>('/azkar/random');
  }
}
