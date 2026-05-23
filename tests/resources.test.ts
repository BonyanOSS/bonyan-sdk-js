import { describe, expect, it } from 'vitest';
import { ValidationError } from '../src/index.js';
import { TEST_BASE_URL, mockClient, ok } from './helpers.js';

describe('SurahResource', () => {
  it('list() returns the surah array', async () => {
    const { client } = mockClient(ok({ surah: [{ id: 1, name: 'Al-Fatiha', apiName: 'quran.com' }] }));
    await expect(client.surah.list()).resolves.toEqual([{ id: 1, name: 'Al-Fatiha', apiName: 'quran.com' }]);
  });

  it('getById() validates 1-114', async () => {
    const { client } = mockClient(ok({ id: 1, name: 'A', apiName: 'quran.com' }));
    await client.surah.getById(1);
    await expect(client.surah.getById(115)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AyatResource', () => {
  it('getById() validates global range', async () => {
    const { client } = mockClient(
      ok({ surahNumber: 1, surahName: 'A', aya: { number: 1, text: '', numberInSurah: 1 } }),
    );
    await client.ayat.getById(1);
    await expect(client.ayat.getById(0)).rejects.toBeInstanceOf(ValidationError);
    await expect(client.ayat.getById(7000)).rejects.toBeInstanceOf(ValidationError);
  });

  it('getBySurah() validates surah and aya', async () => {
    const { client, fetchMock } = mockClient(ok({ surahNumber: 2, surahName: 'Al-Baqarah', aya: {} }));
    await client.ayat.getBySurah(2, 255);
    expect(fetchMock).toHaveBeenCalledWith(`${TEST_BASE_URL}/ayat/2/aya/255`, expect.anything());
  });

  it('search() reshapes the {total, data} envelope', async () => {
    const { client } = mockClient(ok({ total: 2, data: [{ aya: 1 }, { aya: 2 }] }));
    const result = await client.ayat.search('الرحمن');
    expect(result.total).toBe(2);
    expect(result.results).toHaveLength(2);
  });

  it('search() enforces limit ≤ 500', async () => {
    const { client } = mockClient(ok({ total: 0, data: [] }));
    await expect(client.ayat.search('x', { limit: 501 })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('AzkarResource', () => {
  it('listCategories() returns the categories array', async () => {
    const { client } = mockClient(ok({ categories: [{ name: 'morning', count: 10, apiName: 'hisnmuslim.com' }] }));
    await expect(client.azkar.listCategories()).resolves.toEqual([
      { name: 'morning', count: 10, apiName: 'hisnmuslim.com' },
    ]);
  });

  it('getByCategory() URL-encodes the category', async () => {
    const { client, fetchMock } = mockClient(ok({ category: 'morning', items: [], apiName: 'hisnmuslim.com' }));
    await client.azkar.getByCategory('أذكار الصباح');
    expect(fetchMock.mock.calls[0]![0]).toContain('/azkar/%D8%A3');
  });

  it('search() reshapes the envelope', async () => {
    const { client } = mockClient(ok({ total: 1, data: [{ category: 'm', item: { id: 1, text: '' } }] }));
    const result = await client.azkar.search('استغفر');
    expect(result.total).toBe(1);
    expect(result.results[0]?.category).toBe('m');
  });
});

describe('HadithResource', () => {
  it('getBook() passes from/to as query params', async () => {
    const { client, fetchMock } = mockClient(ok({ book: 'bukhari', available: 1, hadiths: [] }));
    await client.hadith.getBook('bukhari', { from: 1, to: 50 });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('from=1');
    expect(url).toContain('to=50');
  });

  it('random() forwards optional book filter', async () => {
    const { client, fetchMock } = mockClient(ok({ book: 'muslim', hadith: {} }));
    await client.hadith.random({ book: 'muslim' });
    expect(fetchMock.mock.calls[0]![0]).toContain('book=muslim');
  });

  it('getByNumber() validates inputs', async () => {
    const { client } = mockClient(ok({}));
    await expect(client.hadith.getByNumber('', 1)).rejects.toBeInstanceOf(ValidationError);
    await expect(client.hadith.getByNumber('bukhari', 0)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('TafsirResource', () => {
  it('forSurah() supports optional aya filter', async () => {
    const { client, fetchMock } = mockClient(ok([]));
    await client.tafsir.forSurah('ar.muyassar', 1, { aya: 2 });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/tafsir/ar.muyassar/1');
    expect(url).toContain('aya=2');
  });

  it('forAya() validates all three inputs', async () => {
    const { client } = mockClient(ok({}));
    await expect(client.tafsir.forAya('', 1, 1)).rejects.toBeInstanceOf(ValidationError);
    await expect(client.tafsir.forAya('ar.muyassar', 115, 1)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('PrayerResource', () => {
  it('getTimes() with coordinates', async () => {
    const { client, fetchMock } = mockClient(ok({ date: '2026-05-23', timings: {} }));
    await client.prayer.getTimes({ latitude: 21.42, longitude: 39.82 });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('latitude=21.42');
    expect(url).toContain('longitude=39.82');
  });

  it('getTimes() with city + country', async () => {
    const { client, fetchMock } = mockClient(ok({ date: '2026-05-23', timings: {} }));
    await client.prayer.getTimes({ city: 'Mecca', country: 'SA' });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('city=Mecca');
    expect(url).toContain('country=SA');
  });

  it('getTimes() rejects incomplete options', async () => {
    const { client } = mockClient(ok({}));
    await expect(client.prayer.getTimes({ latitude: 21.42 })).rejects.toBeInstanceOf(ValidationError);
    await expect(client.prayer.getTimes({})).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('HijriResource', () => {
  it('today() / fromGregorian / toGregorian hit the right paths', async () => {
    const { client, fetchMock } = mockClient(ok({ hijri: {}, gregorian: {}, apiName: 'aladhan.com' }));

    await client.hijri.today();
    expect(fetchMock.mock.calls[0]![0]).toContain('/hijri/today');

    await client.hijri.fromGregorian('01-01-2026');
    expect(fetchMock.mock.calls[1]![0]).toContain('/hijri/from-gregorian?date=01-01-2026');

    await client.hijri.toGregorian('15-06-1447');
    expect(fetchMock.mock.calls[2]![0]).toContain('/hijri/to-gregorian?date=15-06-1447');
  });

  it('rejects malformed dates', async () => {
    const { client } = mockClient(ok({}));
    await expect(client.hijri.toGregorian('2026-01-01')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('QiblaResource', () => {
  it('getDirection() validates coordinates', async () => {
    const { client, fetchMock } = mockClient(
      ok({ latitude: 40.71, longitude: -74.0, direction: 58.48, apiName: 'aladhan.com' }),
    );

    await client.qibla.getDirection(40.7128, -74.006);
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toContain('latitude=40.7128');
    expect(url).toContain('longitude=-74.006');

    await expect(client.qibla.getDirection(91, 0)).rejects.toBeInstanceOf(ValidationError);
    await expect(client.qibla.getDirection(0, 181)).rejects.toBeInstanceOf(ValidationError);
  });
});
