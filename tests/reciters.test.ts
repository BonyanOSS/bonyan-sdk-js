import { describe, expect, it } from 'vitest';
import { BonyanApiError } from '../src/index.js';
import { fail, mockClient, ok } from './helpers.js';

describe('RecitersResource', () => {
  it('list() unwraps { reciters } from the envelope', async () => {
    const { client, fetchMock } = mockClient(
      ok({
        reciters: [{ id: 1, name: 'Abdul Basit', apiName: 'mp3quran.net' }],
      }),
    );

    await expect(client.reciters.list()).resolves.toEqual([
      { id: 1, name: 'Abdul Basit', apiName: 'mp3quran.net' },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getById() validates and encodes the id', async () => {
    const { client, fetchMock } = mockClient(ok({ id: 1, name: 'Reciter', apiName: 'mp3quran.net' }));

    await client.reciters.getById(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters/1',
      expect.anything(),
    );

    await expect(() => client.reciters.getById(0)).rejects.toThrow(/integer between 1/);
    await expect(() => client.reciters.getById(1.5)).rejects.toThrow(/integer between 1/);
  });

  it('search() URL-encodes the Arabic query', async () => {
    const { client, fetchMock } = mockClient(ok([]));

    await client.reciters.search('العفاسي');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters/search?name=%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A',
      expect.anything(),
    );

    await expect(() => client.reciters.search('')).rejects.toThrow(/non-empty/);
    await expect(() => client.reciters.search('   ')).rejects.toThrow(/non-empty/);
  });

  it('getSurah() validates reciter id and surah number', async () => {
    const { client, fetchMock } = mockClient(ok({ reciter: 'X', surah: 1, audio: 'https://…' }));

    await client.reciters.getSurah(1, 1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.bonyanoss.org/bonyan-api/v1/reciters/1/surah/1',
      expect.anything(),
    );

    await expect(() => client.reciters.getSurah(1, 115)).rejects.toThrow(/between 1 and 114/);
    await expect(() => client.reciters.getSurah(-1, 1)).rejects.toThrow(/integer between 1/);
  });

  it('throws BonyanApiError on a 404 response with code and requestId', async () => {
    const { client } = mockClient(fail(404, 'Reciter not found', 'NOT_FOUND', 'req_123'));

    await expect(client.reciters.getById(999)).rejects.toMatchObject({
      name: 'BonyanApiError',
      status: 404,
      code: 'NOT_FOUND',
      requestId: 'req_123',
      message: 'Reciter not found',
    });
    await expect(client.reciters.getById(999)).rejects.toBeInstanceOf(BonyanApiError);
  });
});
