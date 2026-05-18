import { ApiError, BonyanApiError, BonyanRequestError, NetworkError } from './errors.js';
import type { BonyanClientOptions, BonyanFetch } from './types.js';

type QueryValue = boolean | number | string | null | undefined;

export interface BonyanRequestInit extends RequestInit {
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
  raw?: boolean;
  unwrap?: boolean;
}

interface HttpClientOptions extends Required<Pick<BonyanClientOptions, 'baseUrl' | 'timeoutMs' | 'retry'>> {
  headers?: Record<string, string>;
  fetch?: BonyanFetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private readonly retry: number;
  private readonly fetchFn: BonyanFetch | undefined;

  constructor(options: HttpClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.timeoutMs = options.timeoutMs;
    this.headers = options.headers ?? {};
    this.retry = Math.max(0, options.retry);
    this.fetchFn = options.fetch;
  }

  async get<T>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async raw<T = unknown>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, raw: true });
  }

  async request<T>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const attempts = this.retry + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.requestOnce<T>(url, options);
      } catch (error) {
        lastError = error;
        const retryAfterMs = error instanceof ApiError ? error.retryAfterMs : undefined;
        const canRetry =
          attempt < attempts - 1 &&
          (error instanceof NetworkError ||
            error instanceof BonyanRequestError ||
            (error instanceof ApiError && error.status >= 500));

        if (!canRetry) {
          throw error;
        }

        await sleep(retryAfterMs ?? 100 * 2 ** attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new NetworkError('Bonyan API request failed', lastError);
  }

  private async requestOnce<T>(url: string, options: BonyanRequestInit): Promise<T> {
    const fetchFn = await this.getFetch();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);

    try {
      const response = await fetchFn(url, {
        ...options,
        headers: mergeHeaders(this.headers, options.headers),
        signal: options.signal ?? controller.signal,
      });

      if (options.raw) {
        return response as T;
      }

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw BonyanApiError.fromResponse(
          response.status,
          body,
          response.statusText,
          parseRetryAfterHeader(response.headers.get('retry-after')),
        );
      }

      return maybeUnwrap<T>(body, options.unwrap ?? true);
    } catch (error) {
      if (error instanceof ApiError || error instanceof BonyanApiError) {
        throw error;
      }

      throw BonyanRequestError.from(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getFetch(): Promise<BonyanFetch> {
    if (this.fetchFn) {
      return this.fetchFn;
    }

    if (globalThis.fetch) {
      return globalThis.fetch.bind(globalThis);
    }

    const crossFetch = await import('cross-fetch');
    return crossFetch.default as BonyanFetch;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function mergeHeaders(defaults: Record<string, string>, overrides?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/json',
    ...defaults,
    ...headersToObject(overrides),
  };
}

function headersToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  return Object.fromEntries(new Headers(headers).entries());
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function maybeUnwrap<T>(body: unknown, unwrap: boolean): T {
  if (!unwrap) {
    return body as T;
  }

  if (typeof body === 'object' && body !== null && 'success' in body && 'data' in body) {
    const keys = Object.keys(body);
    if (keys.length === 2) {
      return (body as { data: T }).data;
    }
  }

  return body as T;
}

function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return seconds * 1000;
  }

  const timestamp = Date.parse(value);
  if (!Number.isNaN(timestamp)) {
    return Math.max(0, timestamp - Date.now());
  }

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
