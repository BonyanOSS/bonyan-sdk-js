import { describe, expect, it, vi } from 'vitest';
import { BonyanApiError, BonyanClient } from '../src/index.js';
import type { BonyanFetch } from '../src/types.js';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('reciters resource', () => {
  it('lists reciters and unwraps the API response data', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        data: {
          reciters: [
            {
              id: 1,
              name: 'Abdul Basit',
              apiName: 'mp3quran.net',
            },
          ],
        },
      }),
    ) as unknown as BonyanFetch;

    const client = new BonyanClient({
      baseUrl: 'https://api.bonyanoss.org/bonyan-api/v1',
      fetch: fetchMock,
    });

    await expect(client.reciters.list()).resolves.toEqual([
      {
        id: 1,
        name: 'Abdul Basit',
        apiName: 'mp3quran.net',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('searches reciters by name', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        data: [],
      }),
    ) as unknown as BonyanFetch;

    const client = new BonyanClient({
      baseUrl: 'https://api.bonyanoss.org/bonyan-api/v1/',
      fetch: fetchMock,
    });

    await client.reciters.search('العفاسي');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters/search?name=%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A',
      expect.any(Object),
    );
  });

  it('throws a typed API error for non-2xx responses', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          success: false,
          message: 'Reciter not found',
          error: {
            code: 'NOT_FOUND',
            message: 'Reciter not found',
            requestId: 'req_123',
          },
        },
        { status: 404 },
      ),
    ) as unknown as BonyanFetch;

    const client = new BonyanClient({
      baseUrl: 'https://api.bonyanoss.org/bonyan-api/v1',
      fetch: fetchMock,
    });

    await expect(client.reciters.get(999)).rejects.toMatchObject({
      name: 'BonyanApiError',
      status: 404,
      code: 'NOT_FOUND',
      requestId: 'req_123',
    } satisfies Partial<BonyanApiError>);
  });
});
