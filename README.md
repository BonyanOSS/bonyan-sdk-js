# @bonyanoss/bonyan-api

[![npm](https://img.shields.io/npm/v/@bonyanoss/bonyan-api.svg)](https://www.npmjs.com/package/@bonyanoss/bonyan-api)
[![CI](https://github.com/BonyanOSS/bonyan-sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/BonyanOSS/bonyan-sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

Official JavaScript / TypeScript SDK for **[Bonyan-API](https://github.com/BonyanOSS/Bonyan-API)** — a unified API for Quran, Azkar, Hadith, Tafsir, Prayer times, Hijri calendar and Qibla direction, with automatic fallback between multiple upstream sources.

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';

const client = new BonyanClient();

const reciters = await client.reciters.list();
const fatiha = await client.surah.getById(1);
const morning = await client.azkar.getByCategory('أذكار الصباح');
```

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Client options](#client-options)
- [Resources](#resources)
  - [`reciters`](#reciters) · [`surah`](#surah) · [`ayat`](#ayat) · [`azkar`](#azkar) · [`tafsir`](#tafsir) · [`hadith`](#hadith) · [`prayer`](#prayer) · [`hijri`](#hijri) · [`qibla`](#qibla)
- [Error handling](#error-handling)
- [Validation](#validation)
- [Retry and rate limiting](#retry-and-rate-limiting)
- [Custom fetch / environments](#custom-fetch--environments)
- [TypeScript](#typescript)
- [Contributing](#contributing)
- [License](#license)

---

## Install

```bash
npm install @bonyanoss/bonyan-api
pnpm add @bonyanoss/bonyan-api
yarn add @bonyanoss/bonyan-api
```

**Requirements:** Node.js ≥ 18, or any modern browser. No runtime dependencies.

---

## Quick start

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';

const client = new BonyanClient();

// Surahs
const surahs = await client.surah.list();          // 114 chapters
const fatiha = await client.surah.getById(1);

// Ayat
const verse = await client.ayat.getBySurah(2, 255); // Ayat al-Kursi
const search = await client.ayat.search('الرحمن', { limit: 20 });
console.log(search.total, search.results.length);

// Reciters
const reciter = await client.reciters.getById(1);
const audio = await client.reciters.getSurah(1, 1);

// Prayer times
const times = await client.prayer.getTimes({ city: 'Mecca', country: 'SA' });

// Health check
const health = await client.health();
```

---

## Client options

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';

const client = new BonyanClient({
  baseUrl: 'https://api.bonyanoss.org', // default
  timeoutMs: 10_000,                                  // default 10 s
  retry: 3,                                           // default 3
  headers: { 'X-App-Id': 'my-app' },                  // optional
  userAgent: 'my-app/1.0',                            // optional
  fetch: customFetch,                                 // optional custom fetch
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `https://api.bonyanoss.org` | Base URL of the API |
| `timeoutMs` | `number` | `10_000` | Per-request timeout in milliseconds |
| `retry` | `number` | `3` | Retry attempts on 5xx / 429 / network errors |
| `headers` | `Record<string, string>` | — | Extra headers applied to every request |
| `userAgent` | `string` | — | Adds a `User-Agent` header |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Override the fetch implementation |

---

## Resources

Every resource is reachable from the client instance. All methods validate their arguments before hitting the network — invalid input throws [`ValidationError`](#error-handling).

### `reciters`

| Method | Endpoint |
| --- | --- |
| `client.reciters.list()` | `GET /reciters` |
| `client.reciters.getById(id)` | `GET /reciters/:id` |
| `client.reciters.search(name)` | `GET /reciters/search?name=…` |
| `client.reciters.getSurah(reciterId, surah)` | `GET /reciters/:id/surah/:surah` |

```ts
const all = await client.reciters.list();
const reciter = await client.reciters.getById(1);
const matches = await client.reciters.search('العفاسي');
const audio = await client.reciters.getSurah(1, 1);
```

### `surah`

| Method | Endpoint |
| --- | --- |
| `client.surah.list()` | `GET /surah` |
| `client.surah.getById(id)` | `GET /surah/:id` |
| `client.surah.search(name)` | `GET /surah/search?name=…` |

### `ayat`

| Method | Endpoint |
| --- | --- |
| `client.ayat.list()` | `GET /ayat` *(heavy response — every ayah of every surah)* |
| `client.ayat.getById(id)` | `GET /ayat/:id` — global id (1..6236) |
| `client.ayat.getBySurah(surah, aya)` | `GET /ayat/:surah/aya/:aya` — surah (1..114) + aya (1..286) |
| `client.ayat.search(text, { limit })` | `GET /ayat/search?text=…&limit=…` (max 500) |

```ts
const { total, results } = await client.ayat.search('الرحمن', { limit: 50 });
```

### `azkar`

| Method | Endpoint |
| --- | --- |
| `client.azkar.listCategories()` | `GET /azkar` |
| `client.azkar.getByCategory(category)` | `GET /azkar/:category` |
| `client.azkar.search(text, { limit })` | `GET /azkar/search?text=…&limit=…` |
| `client.azkar.random()` | `GET /azkar/random` |

### `tafsir`

| Method | Endpoint |
| --- | --- |
| `client.tafsir.listEditions()` | `GET /tafsir` |
| `client.tafsir.forSurah(edition, surah, { aya })` | `GET /tafsir/:edition/:surah` |
| `client.tafsir.forAya(edition, surah, aya)` | `GET /tafsir/:edition/:surah/:aya` |

### `hadith`

| Method | Endpoint |
| --- | --- |
| `client.hadith.listBooks()` | `GET /hadith` |
| `client.hadith.getBook(bookId, { from, to })` | `GET /hadith/:book` |
| `client.hadith.getByNumber(bookId, number)` | `GET /hadith/:book/:number` |
| `client.hadith.random({ book })` | `GET /hadith/random` |

The `from`/`to` range is capped at **300 items** per request.

### `prayer`

| Method | Endpoint |
| --- | --- |
| `client.prayer.getTimes(options)` | `GET /prayer/times` |

`options` requires **either** `latitude` + `longitude`, **or** `city` + `country`. Optional: `date` (`DD-MM-YYYY`), `method` (calculation method).

### `hijri`

| Method | Endpoint |
| --- | --- |
| `client.hijri.today()` | `GET /hijri/today` |
| `client.hijri.fromGregorian(date?)` | `GET /hijri/from-gregorian?date=DD-MM-YYYY` |
| `client.hijri.toGregorian(date)` | `GET /hijri/to-gregorian?date=DD-MM-YYYY` |

### `qibla`

| Method | Endpoint |
| --- | --- |
| `client.qibla.getDirection(latitude, longitude)` | `GET /qibla?latitude=…&longitude=…` |

### `health`

| Method | Endpoint |
| --- | --- |
| `client.health()` | `GET /health` — returns `{ status, code, timestamp }` (no envelope) |

---

## Error handling

The SDK throws **three** distinct error classes — handle each one by `instanceof` or the exported type guards.

```ts
import {
  BonyanClient,
  BonyanApiError,
  BonyanRequestError,
  ValidationError,
} from '@bonyanoss/bonyan-api';

const client = new BonyanClient();

try {
  await client.reciters.getById(999_999);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input on field:', error.field, error.message);
  } else if (error instanceof BonyanApiError) {
    // The API responded with a non-2xx
    console.error(error.status, error.code, error.requestId, error.message);
  } else if (error instanceof BonyanRequestError) {
    // Network failure, timeout, DNS, …
    console.error('Network error:', error.message);
  }
}
```

| Class | When | Notable fields |
| --- | --- | --- |
| `ValidationError` | Argument failed client-side validation (no network request was sent) | `field` |
| `BonyanApiError` | API returned a non-2xx response | `status`, `code`, `requestId`, `retryAfterMs`, `body` |
| `BonyanRequestError` | Network error, DNS, timeout, abort | `cause` |

Type guards: `isBonyanApiError`, `isBonyanRequestError`, `isValidationError`.

---

## Validation

Every argument is checked **before** a request is sent:

- `surah` must be an integer in `1..114`
- Global aya `id` (used by `ayat.getById`) must be in `1..6236`
- Per-surah `aya` number (in `ayat.getBySurah`, `tafsir.forAya`) must be in `1..286`
- `latitude` ∈ `[-90, 90]`, `longitude` ∈ `[-180, 180]`
- Dates use the `DD-MM-YYYY` format
- Search `limit` is bounded per endpoint (200 for `azkar`, 500 for `ayat`)
- Hadith `from`/`to` range is capped at 300

When validation fails, `ValidationError` is thrown synchronously — no HTTP request is made.

---

## Retry and rate limiting

By default the SDK retries up to **3 times** on:

- `5xx` server errors
- `429 Too Many Requests`
- Network errors (DNS failure, socket reset, timeout)

`Retry-After` headers (in seconds or HTTP-date) are honored. Between attempts the SDK sleeps with **exponential backoff + jitter** (`100ms * 2^attempt + random(0-100)`).

Disable retries entirely:

```ts
const client = new BonyanClient({ retry: 0 });
```

---

## Custom fetch / environments

The SDK uses `globalThis.fetch` by default. To use it on **Node < 18** or with a custom HTTP stack:

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';
import { fetch as undiciFetch } from 'undici';

const client = new BonyanClient({ fetch: undiciFetch as typeof fetch });
```

Works out of the box on:

- ✅ Node.js ≥ 18
- ✅ Browsers (Chrome, Firefox, Safari, Edge)
- ✅ Deno, Bun
- ✅ Cloudflare Workers, Vercel Edge, Netlify Edge

---

## TypeScript

The SDK ships with **strict** type definitions — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`. Every public API has TSDoc comments visible in your editor.

```ts
import type {
  Reciter,
  Surah,
  Aya,
  AzkarItem,
  HadithItem,
  PrayerTimings,
  HijriDate,
  QiblaInfo,
} from '@bonyanoss/bonyan-api';
```

---

## Contributing

We :heart: pull requests! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the dev setup, code style, and how to add a new resource.

Quick start:

```bash
pnpm install
pnpm test
pnpm build
```

---

## License

[MIT](LICENSE) © [BonyanOSS](https://github.com/BonyanOSS)
