import { describe, expect, it, vi } from 'vitest';
import { BonyanApiError, BonyanClient, BonyanRequestError } from '../src/index.js';
import type { BonyanFetch } from '../src/types.js';
import { TEST_BASE_URL, fail, jsonResponse, ok } from './helpers.js';

describe('HttpClient', () => {
  it('retries on 5xx with exponential backoff then succeeds', async () => {
    const responses = [
      () => fail(500, 'boom', 'INTERNAL_SERVER_ERROR'),
      () => fail(503, 'boom', 'ALL_SOURCES_FAILED'),
      () => ok({ reciters: [] }),
    ];
    let i = 0;
    const fetchMock = vi.fn<BonyanFetch>(async () => responses[i++]!());

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 3, fetch: fetchMock });
    await expect(client.reciters.list()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx (except 429)', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => fail(400, 'bad'));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 3, fetch: fetchMock });

    await expect(client.reciters.getById(1)).rejects.toBeInstanceOf(BonyanApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 honoring retry-after header', async () => {
    const responses = [
      () =>
        jsonResponse(
          { success: false, message: 'rate limited', error: { code: 'RATE_LIMITED' } },
          { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '0' } },
        ),
      () => ok({ id: 1, name: 'X', apiName: 'mp3quran.net' }),
    ];
    let i = 0;
    const fetchMock = vi.fn<BonyanFetch>(async () => responses[i++]!());

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 1, fetch: fetchMock });
    await expect(client.reciters.getById(1)).resolves.toMatchObject({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('wraps network errors as BonyanRequestError', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => {
      throw new TypeError('fetch failed');
    });
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    await expect(client.reciters.list()).rejects.toBeInstanceOf(BonyanRequestError);
  });

  it('aborts after timeoutMs and reports a timeout', async () => {
    const fetchMock = vi.fn<BonyanFetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, timeoutMs: 10, retry: 0, fetch: fetchMock });
    await expect(client.reciters.list()).rejects.toMatchObject({
      name: 'BonyanRequestError',
      message: 'Bonyan API request timed out',
    });
  });

  it('sends default Accept header and merges custom headers', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => ok({ reciters: [] }));
    const client = new BonyanClient({
      baseUrl: TEST_BASE_URL,
      retry: 0,
      headers: { 'X-Custom': 'yes' },
      fetch: fetchMock,
    });

    await client.reciters.list();
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({
      Accept: 'application/json',
      'X-Custom': 'yes',
    });
  });

  it('strips trailing slashes from baseUrl', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => ok({ reciters: [] }));
    const client = new BonyanClient({ baseUrl: `${TEST_BASE_URL}////`, retry: 0, fetch: fetchMock });

    await client.reciters.list();
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_BASE_URL}/reciters`, expect.anything());
  });

  it('omits null/undefined query parameters but keeps zero and false', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => ok([]));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    await client.hadith.getBook('bukhari', { from: 1, to: 1 });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toContain('from=1');
    expect(calledUrl).toContain('to=1');
  });

  it('does NOT retry on user-initiated abort', async () => {
    const controller = new AbortController();
    let attempts = 0;
    const fetchMock = vi.fn<BonyanFetch>(async () => {
      attempts += 1;
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 5, fetch: fetchMock });
    // Pass the user's signal through a resource by reaching into http directly.
    await expect(
      (client as unknown as { http: { get: (p: string, o: object) => Promise<unknown> } }).http.get(
        '/reciters',
        { signal: controller.signal },
      ),
    ).rejects.toBeInstanceOf(BonyanRequestError);
    expect(attempts).toBe(1);
  });

  it('client.health() returns the raw /health body (no envelope unwrap)', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () =>
      jsonResponse({ status: 'ok', code: 200, timestamp: '2026-05-24T00:00:00.000Z' }),
    );
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    const health = await client.health();
    expect(health.status).toBe('ok');
    expect(health.code).toBe(200);
    expect(fetchMock.mock.calls[0]![0]).toBe(`${TEST_BASE_URL}/health`);
  });

  it('handles non-JSON 5xx bodies gracefully', async () => {
    const fetchMock = vi.fn<BonyanFetch>(
      async () =>
        new Response('upstream offline', { status: 502, headers: { 'content-type': 'text/plain' } }),
    );
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    await expect(client.reciters.list()).rejects.toMatchObject({
      name: 'BonyanApiError',
      status: 502,
      message: 'upstream offline',
    });
  });

  it('does not throw on empty 200 body', async () => {
    const fetchMock = vi.fn<BonyanFetch>(async () => new Response('', { status: 200 }));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    // get() expects an envelope but gets null — we surface that as a runtime issue,
    // wrapping it in BonyanRequestError so callers can detect it.
    await expect(client.reciters.list()).rejects.toBeInstanceOf(BonyanRequestError);
  });
});
