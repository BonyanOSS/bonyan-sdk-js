import { BonyanApiError, BonyanRequestError } from './errors.js';
import type { BonyanFetch, BonyanSuccessBody } from './types.js';

type QueryValue = boolean | number | string | null | undefined;

export interface BonyanRequestInit extends Omit<RequestInit, 'method'> {
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
}

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  retry: number;
  headers?: Record<string, string>;
  fetch?: BonyanFetch;
  userAgent?: string;
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retry: number;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: BonyanFetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs;
    this.retry = Math.max(0, options.retry);
    this.headers = {
      ...DEFAULT_HEADERS,
      ...(options.userAgent ? { 'User-Agent': options.userAgent } : {}),
      ...options.headers,
    };
    this.fetchFn = options.fetch ?? resolveFetch();
  }

  async get<T>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    const body = await this.requestEnvelope<T>(path, options);
    return body.data;
  }

  async raw<T = unknown>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    return this.requestEnvelope<T>(path, options) as Promise<T>;
  }

  private async requestEnvelope<T>(path: string, options: BonyanRequestInit): Promise<BonyanSuccessBody<T>> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const attempts = this.retry + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.fetchOnce<T>(url, options);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error, attempt, attempts)) {
          throw error;
        }
        const retryAfter = error instanceof BonyanApiError ? error.retryAfterMs : undefined;
        await sleep(retryAfter ?? backoff(attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new BonyanRequestError('Bonyan API request failed', lastError);
  }

  private async fetchOnce<T>(url: string, options: BonyanRequestInit): Promise<BonyanSuccessBody<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);
    const signal = options.signal ? mergeSignals(options.signal, controller.signal) : controller.signal;

    try {
      const response = await this.fetchFn(url, {
        ...options,
        method: 'GET',
        headers: { ...this.headers, ...headersToObject(options.headers) },
        signal,
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw BonyanApiError.fromResponse(
          response.status,
          body,
          response.statusText,
          parseRetryAfter(response.headers.get('retry-after')),
        );
      }

      return body as BonyanSuccessBody<T>;
    } catch (error) {
      if (error instanceof BonyanApiError) {
        throw error;
      }
      throw BonyanRequestError.from(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function resolveFetch(): BonyanFetch {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      'Bonyan SDK requires global fetch (Node.js 18+ or a browser). ' +
        'Pass a custom fetch via `new BonyanClient({ fetch })`.',
    );
  }
  return globalThis.fetch.bind(globalThis);
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function shouldRetry(error: unknown, attempt: number, attempts: number): boolean {
  if (attempt >= attempts - 1) return false;
  if (error instanceof BonyanRequestError) return true;
  if (error instanceof BonyanApiError) return error.status >= 500 || error.status === 429;
  return false;
}

function backoff(attempt: number): number {
  return 100 * 2 ** attempt + Math.floor(Math.random() * 100);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;

  const timestamp = Date.parse(value);
  if (!Number.isNaN(timestamp)) return Math.max(0, timestamp - Date.now());

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b]);
  }
  const controller = new AbortController();
  const onAbort = (signal: AbortSignal) => () => controller.abort(signal.reason);
  if (a.aborted) controller.abort(a.reason);
  else a.addEventListener('abort', onAbort(a), { once: true });
  if (b.aborted) controller.abort(b.reason);
  else b.addEventListener('abort', onAbort(b), { once: true });
  return controller.signal;
}
