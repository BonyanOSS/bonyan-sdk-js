import { describe, expect, it, vi } from 'vitest';
import { BonyanApiError, BonyanClient, BonyanRequestError } from '../src/index.js';
import type { BonyanFetch } from '../src/types.js';
import { TEST_BASE_URL, fail, jsonResponse, ok } from './helpers.js';

describe('HttpClient', () => {
  it('retries on 5xx with exponential backoff then succeeds', async () => {
    const fetchMock = vi
      .fn<BonyanFetch>()
      .mockResolvedValueOnce(fail(500, 'boom', 'INTERNAL_SERVER_ERROR'))
      .mockResolvedValueOnce(fail(503, 'boom', 'ALL_SOURCES_FAILED'))
      .mockResolvedValueOnce(ok({ reciters: [] }));

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 3, fetch: fetchMock });
    await expect(client.reciters.list()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx (except 429)', async () => {
    const fetchMock = vi.fn<BonyanFetch>().mockResolvedValue(fail(400, 'bad'));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 3, fetch: fetchMock });

    await expect(client.reciters.getById(1)).rejects.toBeInstanceOf(BonyanApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 honoring retry-after header', async () => {
    const fetchMock = vi
      .fn<BonyanFetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { success: false, message: 'rate limited', error: { code: 'RATE_LIMITED' } },
          { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '0' } },
        ),
      )
      .mockResolvedValueOnce(ok({ id: 1, name: 'X', apiName: 'mp3quran.net' }));

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 1, fetch: fetchMock });
    await expect(client.reciters.getById(1)).resolves.toMatchObject({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('wraps network errors as BonyanRequestError', async () => {
    const fetchMock = vi.fn<BonyanFetch>().mockRejectedValue(new TypeError('fetch failed'));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    await expect(client.reciters.list()).rejects.toBeInstanceOf(BonyanRequestError);
  });

  it('aborts after timeoutMs and reports a timeout', async () => {
    const fetchMock = vi.fn<BonyanFetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, timeoutMs: 10, retry: 0, fetch: fetchMock });
    await expect(client.reciters.list()).rejects.toMatchObject({
      name: 'BonyanRequestError',
      message: 'Bonyan API request timed out',
    });
  });

  it('sends default Accept header and merges custom headers', async () => {
    const fetchMock = vi.fn<BonyanFetch>().mockResolvedValue(ok({ reciters: [] }));
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
    const fetchMock = vi.fn<BonyanFetch>().mockResolvedValue(ok({ reciters: [] }));
    const client = new BonyanClient({ baseUrl: `${TEST_BASE_URL}////`, retry: 0, fetch: fetchMock });

    await client.reciters.list();
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_BASE_URL}/reciters`, expect.anything());
  });

  it('omits null/undefined query parameters but keeps zero and false', async () => {
    const fetchMock = vi.fn<BonyanFetch>().mockResolvedValue(ok([]));
    const client = new BonyanClient({ baseUrl: TEST_BASE_URL, retry: 0, fetch: fetchMock });

    await client.hadith.getBook('bukhari', { from: 1, to: 1 });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toContain('from=1');
    expect(calledUrl).toContain('to=1');
  });
});
