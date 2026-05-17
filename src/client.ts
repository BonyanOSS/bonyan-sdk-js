import { BonyanApiError, BonyanRequestError } from './errors.js';
import { HttpClient } from './http.js';
import type { BonyanClientOptions } from './types.js';

export const DEFAULT_BASE_URL = 'https://api.bonyanoss.org/bonyan-api/v1';
export const DEFAULT_TIMEOUT_MS = 10_000;

export class BonyanClient {
  private readonly http: HttpClient;

  constructor(options: BonyanClientOptions = {}) {
    const httpOptions = {
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.fetch ? { fetch: options.fetch } : {}),
    };

    this.http = new HttpClient(httpOptions);
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    return this.http.get<T>(path, options);
  }

  async health(options?: RequestInit): Promise<unknown> {
    return this.http.raw('/health', options);
  }
}

export function createBonyanClient(options?: BonyanClientOptions): BonyanClient {
  return new BonyanClient(options);
}

export { BonyanApiError, BonyanRequestError };
