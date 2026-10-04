import { describe, expect, it, vi } from 'vitest';
import { BonyanClient, BonyanApiError, BonyanRequestError, ValidationError } from '../src/index.js';
import type { BonyanFetch, PrayerMethod, TafsirItem } from '../src/index.js';
import { jsonResponse, mockClient, ok } from './helpers.js';

describe('normalized API contracts', () => {
  it.each(['ayat', 'azkar'] as const)('preserves flat %s search counts and provenance', async (resource) => {
    const hits =
      resource === 'ayat'
        ? [
            {
              surahNumber: 1,
              surahName: 'الفاتحة',
              aya: { number: 1, numberInSurah: 1, text: 'الله' },
              apiName: 'quran.com',
            },
          ]
        : [
            {
              category: 'أذكار الصباح',
              item: { id: 1, text: 'الله' },
              apiName: 'cdn.jsdelivr.net/rn0x/hisn_almuslim_json',
            },
          ];
    const { client, fetchMock } = mockClient(jsonResponse({ success: true, total: 1, data: hits }));
    await expect(client[resource].search('الله', { limit: 1 })).resolves.toEqual({ total: 1, results: hits });
    expect(new URL(fetchMock.mock.calls[0]![0]).searchParams.get('limit')).toBe('1');
  });

  it.each([
    { success: true, data: [] },
    { success: false, total: 0, data: [] },
    { success: true, total: 1, data: [] },
    { success: true, total: -1, data: {} },
  ])('rejects malformed search responses: %j', async (body) => {
    const { client } = mockClient(jsonResponse(body));
    await expect(client.ayat.search('الله')).rejects.toBeInstanceOf(BonyanRequestError);
  });

  it('does not unwrap failed success envelopes', async () => {
    const { client } = mockClient(jsonResponse({ success: false, data: {} }));
    await expect(client.surah.getById(1)).rejects.toBeInstanceOf(BonyanRequestError);
  });

  it('forwards moshaf selection and returns recording identity', async () => {
    const audio = {
      reciter: 'مشاري العفاسي',
      surah: 1,
      audio: 'https://example.test/001.mp3',
      moshafId: 7,
      rewayaId: 1,
      apiName: 'mp3quran.net',
    };
    const { client, fetchMock } = mockClient(ok(audio));
    await expect(client.reciters.getSurah(123, 1, { moshaf: 7 })).resolves.toEqual(audio);
    expect(new URL(fetchMock.mock.calls[0]![0]).searchParams.get('moshaf')).toBe('7');
    await expect(client.reciters.getSurah(123, 1, { moshaf: 0 })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('forSurah returns an array even with aya, using public edition IDs', async () => {
    const rows: TafsirItem[] = [
      { surah: 1, aya: 1, text: 'تفسير', edition: 'muyassar', apiName: 'quran.com' },
    ];
    const { client, fetchMock } = mockClient(ok(rows));
    const result: TafsirItem[] = await client.tafsir.forSurah('muyassar', 1, { aya: 1 });
    expect(result).toEqual(rows);
    await expect(client.tafsir.forAya('ar.muyassar', 1, 1)).rejects.toBeInstanceOf(ValidationError);
    await expect(client.tafsir.forSurah('jalalayn', 1)).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('validates Gregorian and Hijri dates separately', async () => {
    const { client, fetchMock } = mockClient(ok({ calendar: 'islamic-umalqura', apiName: 'local' }));
    await client.hijri.fromGregorian('29-02-2024');
    await client.hijri.toGregorian('30-02-1448');
    for (const date of ['31-02-2026', '29-02-2025', '01-01-0999'])
      await expect(client.hijri.fromGregorian(date)).rejects.toBeInstanceOf(ValidationError);
    for (const date of ['31-02-1448', '01-13-1448', '01-01-2401'])
      await expect(client.hijri.toGregorian(date)).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('validates defaulted inclusive hadith bounds without treating available as maximum ID', async () => {
    const data = {
      book: 'Book',
      available: 2,
      hadiths: [
        {
          number: 400,
          text: 'حديث',
          book: 'Book',
          apiName: 'raw.githubusercontent.com/gadingnst/hadith-api',
        },
      ],
    };
    const { client, fetchMock } = mockClient(ok(data));
    await expect(client.hadith.getBook('bukhari', { from: 400, to: 699 })).resolves.toEqual(data);
    await expect(client.hadith.getBook('bukhari', { to: 301 })).rejects.toBeInstanceOf(ValidationError);
    await expect(client.hadith.getBook('bukhari', { from: 400, to: 700 })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('forwards timezone and validates method before sending prayer requests', async () => {
    const { client, fetchMock } = mockClient(ok({ timezone: 'Asia/Riyadh', apiName: 'local' }));
    await client.prayer.getTimes({ latitude: 21.42, longitude: 39.82, method: 4, timezone: 'Asia/Riyadh' });
    expect(new URL(fetchMock.mock.calls[0]![0]).searchParams.get('timezone')).toBe('Asia/Riyadh');
    await expect(
      client.prayer.getTimes({ latitude: 21, longitude: 39, method: 7 as PrayerMethod }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      client.prayer.getTimes({ latitude: 21, longitude: 39, timezone: 'invalid' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      client.prayer.getTimes({ latitude: 21, longitude: 39, date: '31-02-2026' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('transport options', () => {
  it('merges per-call headers without case-sensitive duplicates', async () => {
    const { client, fetchMock } = mockClient(ok({ surah: [] }));
    await client.surah.list({ headers: { accept: 'application/custom+json' }, timeoutMs: 50 });
    const headers = new Headers(fetchMock.mock.calls[0]![1].headers);
    expect(headers.get('Accept')).toBe('application/custom+json');
  });

  it('skips transport when already cancelled', async () => {
    const { client, fetchMock } = mockClient(ok({ surah: [] }));
    const controller = new AbortController();
    controller.abort();
    await expect(client.surah.list({ signal: controller.signal })).rejects.toBeInstanceOf(BonyanRequestError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels during Retry-After without waiting or retrying', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<BonyanFetch>(async () => {
      setTimeout(() => controller.abort(), 5);
      return jsonResponse(
        { success: false, message: 'wait' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    });
    const client = new BonyanClient({ fetch: fetchMock, retry: 2 });
    await expect(client.surah.list({ signal: controller.signal })).rejects.toBeInstanceOf(BonyanRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([NaN, Infinity, -1, 0.5])('rejects invalid retry: %s', (retry) => {
    expect(() => new BonyanClient({ retry })).toThrow(ValidationError);
  });

  it('respects per-call timeout and preserves HTTP error metadata', async () => {
    const { client } = mockClient(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
        }),
    );
    await expect(client.health({ timeoutMs: 5 })).rejects.toBeInstanceOf(BonyanRequestError);
    const failing = mockClient(
      jsonResponse(
        { success: false, error: { code: 'NOT_FOUND', requestId: 'request', message: 'missing' } },
        { status: 404 },
      ),
    );
    await expect(failing.client.ayat.search('الله')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      requestId: 'request',
    });
    await expect(failing.client.ayat.search('الله')).rejects.toBeInstanceOf(BonyanApiError);
  });
});
