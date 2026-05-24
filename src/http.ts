import { BonyanApiError, BonyanRequestError } from './errors.js';
import type { BonyanFetch, BonyanSuccessBody } from './types.js';

type QueryValue = boolean | number | string | null | undefined;

/**
 * Options accepted by {@link HttpClient.get} / {@link HttpClient.raw}.
 *
 * `BonyanRequestInit` is intentionally a narrow subset of `RequestInit` —
 * the SDK only issues GET requests, so `method` and `body` are not exposed.
 */
export interface BonyanRequestInit {
  /** Query string parameters. `null` / `undefined` values are omitted. */
  query?: Record<string, QueryValue>;
  /** Per-request timeout in milliseconds, overrides the client default. */
  timeoutMs?: number;
  /** Extra headers — merged on top of the client defaults. */
  headers?: HeadersInit;
  /** Caller-supplied AbortSignal — composed with the timeout signal. */
  signal?: AbortSignal;
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

/**
 * Thin fetch wrapper used by every resource. Centralizes retry/backoff,
 * timeouts, header management and envelope unwrapping so individual resources
 * stay declarative.
 */
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

  /** Performs a GET and unwraps the `{ success: true, data: T }` envelope. */
  async get<T>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    const body = await this.request<unknown>(path, options);
    if (isEnvelope(body)) {
      return body.data as T;
    }
    throw new BonyanRequestError(
      'Unexpected response from Bonyan API — missing `data` field in envelope',
      body,
    );
  }

  /** Performs a GET and returns the parsed body **as-is**, without unwrapping. */
  async raw<T = unknown>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    return this.request<T>(path, options);
  }

  private async request<T>(path: string, options: BonyanRequestInit): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const attempts = this.retry + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.fetchOnce<T>(url, options);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error, attempt, attempts, options.signal)) {
          throw error;
        }
        const retryAfter = error instanceof BonyanApiError ? error.retryAfterMs : undefined;
        await sleep(retryAfter ?? backoff(attempt));
      }
    }

    // Defensive: shouldRetry guarantees the loop either returns or throws,
    // but TypeScript can't see that, so we surface the last error explicitly.
    throw lastError instanceof Error
      ? lastError
      : new BonyanRequestError('Bonyan API request failed', lastError);
  }

  private async fetchOnce<T>(url: string, options: BonyanRequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);
    const merged = options.signal
      ? mergeSignals(options.signal, controller.signal)
      : { signal: controller.signal };

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: { ...this.headers, ...headersToObject(options.headers) },
        signal: merged.signal,
      });

      const body = await safeParseResponseBody(response);

      if (!response.ok) {
        throw BonyanApiError.fromResponse(
          response.status,
          body,
          response.statusText,
          parseRetryAfter(response.headers.get('retry-after')),
        );
      }

      return body as T;
    } catch (error) {
      if (error instanceof BonyanApiError) {
        throw error;
      }
      throw BonyanRequestError.from(error);
    } finally {
      clearTimeout(timeout);
      merged.cleanup?.();
    }
  }
}

function resolveFetch(): BonyanFetch {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      'Bonyan SDK requires global fetch (Node.js 20+ or a browser). ' +
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

/**
 * Parses a `Response` body without throwing — returns a deterministic value
 * (object / string / null) that downstream code can inspect.
 */
async function safeParseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    if (text === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
}

function shouldRetry(
  error: unknown,
  attempt: number,
  attempts: number,
  userSignal: AbortSignal | undefined,
): boolean {
  if (attempt >= attempts - 1) return false;
  // Respect user-initiated aborts: never retry past an explicit cancel.
  if (userSignal?.aborted) return false;

  if (error instanceof BonyanApiError) {
    return error.status >= 500 || error.status === 429;
  }
  if (error instanceof BonyanRequestError) {
    // If the request error wraps a user AbortError, don't retry.
    const cause = error.cause;
    if (cause instanceof DOMException && cause.name === 'AbortError' && userSignal?.aborted) {
      return false;
    }
    return true;
  }
  return false;
}

function isEnvelope(value: unknown): value is BonyanSuccessBody<unknown> {
  return typeof value === 'object' && value !== null && 'data' in value;
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

interface MergedSignal {
  signal: AbortSignal;
  cleanup?: () => void;
}

/**
 * Combines two AbortSignals so the resulting signal aborts as soon as either
 * input aborts. Uses {@link AbortSignal.any} when available (Node 20+), and
 * falls back to a manual implementation that **always** removes its listeners
 * to avoid leaking references when callers reuse a long-lived signal.
 */
function mergeSignals(a: AbortSignal, b: AbortSignal): MergedSignal {
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any([a, b]) };
  }

  const controller = new AbortController();
  if (a.aborted) {
    controller.abort(a.reason);
    return { signal: controller.signal };
  }
  if (b.aborted) {
    controller.abort(b.reason);
    return { signal: controller.signal };
  }

  const onA = () => controller.abort(a.reason);
  const onB = () => controller.abort(b.reason);
  a.addEventListener('abort', onA, { once: true });
  b.addEventListener('abort', onB, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      a.removeEventListener('abort', onA);
      b.removeEventListener('abort', onB);
    },
  };
}
