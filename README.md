# @bonyanoss/bonyan-api

JavaScript and TypeScript SDK for [Bonyan API](https://github.com/BonyanOSS/Bonyan-API). Version 2.0.0 matches API commit `c851b1a`: package `2.1.0`, OpenAPI contract `3.0.0`.

## Install

```bash
npm install @bonyanoss/bonyan-api@2.0.0
```

Node.js 22.12 or later is supported. Browsers can use a bundler and standard fetch, URL and AbortController APIs. There are no runtime dependencies. The package includes ESM, CommonJS and TypeScript declarations.

## Usage

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';

const client = new BonyanClient({ timeoutMs: 45000, retry: 1 });
const surahs = await client.surah.list();
const { total, results } = await client.ayat.search('الرحمن', { limit: 10 });
console.log(surahs[0]?.name, total, results[0]?.apiName);

const times = await client.prayer.getTimes({
  latitude: 21.4225,
  longitude: 39.8262,
  method: 4,
  timezone: 'Asia/Riyadh',
});
console.log(times.timings.Fajr, times.timezone);
```

`createBonyanClient(options)` is equivalent to `new BonyanClient(options)`. Reuse a client for a given configuration.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `baseUrl` | `https://api.bonyanoss.org` | Origin and optional gateway prefix; trailing slashes are removed. |
| `timeoutMs` | `10000` | Positive integer milliseconds per attempt, up to 2147483647. |
| `retry` | `3` | Nonnegative integer retries after the initial attempt. |
| `headers` | `Accept: application/json` | Headers applied to every request. |
| `fetch` | `globalThis.fetch` | Standard fetch implementation for tests or custom transport. |
| `userAgent` | Unset | Optional User-Agent; browser behavior depends on the platform. |

Every method accepts optional `BonyanRequestOptions` as its last argument: `signal`, `timeoutMs` and `headers`. Pass domain options before transport options.

```ts
const controller = new AbortController();
const operation = client.ayat.search('الله', { limit: 10 }, {
  signal: controller.signal,
  timeoutMs: 45000,
});
controller.abort();
await operation.catch(console.error);

await client.surah.getById(1, { headers: { 'X-Application': 'my-app' } });
await client.health({ timeoutMs: 2000 });
```

Cancellation stops active requests and retry delays. An already aborted signal prevents fetch. Timeouts apply per attempt; use a signal for a total deadline. Header names merge case-insensitively.

## Resources

Methods return Promises. Content methods unwrap `data`; lists return arrays directly. Search preserves the top-level `total` as `{ total, results }`. No method writes to the server. The signatures below omit the optional transport argument.

| Method | Result |
| --- | --- |
| `surah.list()` | `Surah[]` |
| `surah.getById(id)` | `Surah` |
| `surah.search(name)` | `Surah[]` |
| `ayat.list()` | `SurahWithAyat[]`, the full Quran |
| `ayat.getById(id)` | `AyaWithSurah` |
| `ayat.getBySurah(surah, aya)` | `AyaWithSurah` |
| `ayat.search(text, { limit }?)` | `AyatSearchResult` |
| `reciters.list()` | `Reciter[]` |
| `reciters.getById(id)` | `Reciter` |
| `reciters.search(name)` | `Reciter[]` |
| `reciters.getSurah(id, surah, { moshaf }?)` | `ReciterAudio` |
| `tafsir.listEditions()` | `TafsirEdition[]` |
| `tafsir.forSurah(edition, surah, { aya }?)` | `TafsirItem[]`, even with a filter |
| `tafsir.forAya(edition, surah, aya)` | `TafsirItem` |
| `azkar.listCategories()` | `AzkarCategorySummary[]` |
| `azkar.getByCategory(category)` | `AzkarCategory` |
| `azkar.search(text, { limit }?)` | `AzkarSearchResult` |
| `azkar.random()` | `AzkarSearchHit` |
| `hadith.listBooks()` | `HadithBook[]` |
| `hadith.getBook(book, { from, to }?)` | `HadithBookContent` |
| `hadith.getByNumber(book, number)` | `HadithItem` |
| `hadith.random({ book }?)` | `HadithRandomResult` |
| `prayer.getTimes(options)` | `PrayerTimings` |
| `hijri.today()` | `HijriDate` |
| `hijri.fromGregorian(date?)` | `HijriDate` |
| `hijri.toGregorian(date)` | `HijriDate` |
| `qibla.getDirection(latitude, longitude)` | `QiblaInfo` |
| `routes()` | `BonyanRouteCatalogue`, raw JSON |
| `health()` | `HealthStatus`, raw JSON |
| `ready()` | `ReadyStatus`, raw JSON |
| `metrics()` | Prometheus text |

Search uses normalized Arabic substrings. No match returns HTTP 404 through `BonyanApiError`. `total` counts returned matches after the limit; there is no pagination or corpus-wide count.

Reciter `moshaf` recordings expose `surahList`, `rewayaId` and `type`. `moshaf` selection uses a recording ID from that catalogue. Without a selector, the API prefers a covering Hafs murattal recording. Audio results include `moshafId`, `rewayaId` and `apiName` after HEAD verification. Subsequent playback can still fail.

Tafsir supports `muyassar` and `saadi`. Returned `edition` stays the public ID across sources. Prayer methods are `1, 2, 3, 4, 5, 9, 10, 11`, default `4`. Seven timings use `HH:mm` in `timezone`, default `UTC`. The local fallback needs coordinates and preserves date, method and timezone; city-only requests need a provider. Prayer `hijri` is optional.

Hijri results include `calendar: 'islamic-umalqura'`, with Aladhan or local Intl provenance. Hadith numbering can have gaps. `available` counts stored narrations, not the maximum lookup number; ranges can return fewer items than requested.

## Validation and errors

Inputs reject with `ValidationError` before transport: surah `1..114`, global verse `1..6236`, verse within surah `1..286`, bounded coordinates, supported tafsir/prayer settings, real Gregorian dates and bounded Hijri dates. The server handles nonexistent verses within valid bounds. Search limits are `1..500` for ayat and `1..200` for azkar. Inclusive hadith ranges allow 300 requested numbers, including defaulted bounds. Defaults are `from=1`, `to=from+29`.

```ts
import { BonyanApiError, BonyanRequestError, ValidationError } from '@bonyanoss/bonyan-api';

try {
  await client.ayat.search('الرحمن');
} catch (error) {
  if (error instanceof ValidationError) console.error(error.field, error.message);
  else if (error instanceof BonyanApiError) console.error(error.status, error.code, error.requestId);
  else if (error instanceof BonyanRequestError) console.error(error.message, error.cause);
  else throw error;
}
```

`BonyanApiError` also exposes `statusText`, `retryAfterMs` and `body`. Type guards are `isBonyanApiError`, `isBonyanRequestError` and `isValidationError`. Proxy responses may omit API metadata. Malformed success envelopes and search counts reject with `BonyanRequestError`. Other response fields are described by TypeScript and are not exhaustively validated at runtime.

HTTP 429, HTTP 5xx and transport failures are retried. Default `retry: 3` allows four attempts. Valid `Retry-After` overrides exponential backoff (`100 * 2^attempt` milliseconds plus `0..99` milliseconds of jitter). Caller cancellation is never retried. `retry: 0` disables retries.

## Migration from 1.0.2

Version 2.0.0 aligns response types with the current API. Search returns valid `{ total, results }`; remove old adapters. Use `muyassar` instead of `ar.muyassar`; unsupported editions reject before transport. `forSurah()` is always an array. Reciter `moshaf`, surah `makkia`, prayer metadata and the Hijri calendar field are required. Source unions reflect current adapters and local fallbacks. Legacy `style`, `Imsak` and `Midnight` fields are removed.

## Development

Use the pnpm version in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm pack --pack-destination ./dist
```

TypeScript remains on the compatible 6.0 line: the current ESLint parser requires `<6.1.0`, and declaration generation uses the JavaScript compiler API. Node declarations track the oldest supported Node 22 runtime.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [the documentation](https://docs.bonyanoss.org). [MIT license](LICENSE).
