import { BonyanApiError, BonyanRequestError } from './errors.js';
import type { BonyanClientOptions, BonyanErrorBody, BonyanFetch, BonyanSuccessBody } from './types.js';

type QueryValue = boolean | number | string | null | undefined;

export interface BonyanRequestInit extends RequestInit {
  query?: Record<string, QueryValue>;
}

interface HttpClientOptions extends Required<Pick<BonyanClientOptions, 'baseUrl' | 'timeoutMs'>> {
  headers?: HeadersInit;
  fetch?: BonyanFetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly headers: HeadersInit | undefined;
  private readonly fetchFn: BonyanFetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.timeoutMs = options.timeoutMs;
    this.headers = options.headers;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async get<T>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    const body = await this.raw<BonyanSuccessBody<T>>(path, options);
    return body.data;
  }

  async raw<T = unknown>(path: string, options: BonyanRequestInit = {}): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        ...options,
        headers: mergeHeaders(this.headers, options.headers),
        signal: options.signal ?? controller.signal,
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw BonyanApiError.fromResponse(response.status, body);
      }

      return body as T;
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

function mergeHeaders(defaults?: HeadersInit, overrides?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/json',
    ...headersToObject(defaults),
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

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
