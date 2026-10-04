# Changelog

All notable changes to `@bonyanoss/bonyan-api` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-04

Matches API commit c851b1a (package 2.1.0, OpenAPI contract 3.0.0).

### Changed

- Align response types and provider unions with normalized reciter, Quran, azkar, tafsir, prayer and Hijri contracts. Required metadata and removed legacy fields make this a major SDK release.
- Use public tafsir IDs muyassar and saadi; forSurah always returns an array.
- Require Node.js 22.12 or later. Update compatible tooling, Vitest 5 and pnpm 11. Keep TypeScript 6 for parser and compiler API compatibility.

### Added

- Optional moshaf selection, prayer timezone and source provenance.
- Optional signal, timeoutMs and headers as the last argument of every public method.
- Regression tests for flat search envelopes, recording selection, calendar validation and cancellation during retries.

### Fixed

- Preserve top-level search total and data rather than reading them from the unwrapped array.
- Validate Gregorian dates, Hijri date bounds, prayer methods/timezones and defaulted inclusive hadith ranges.
- Reject invalid timeout/retry settings and failed success envelopes; merge headers case-insensitively and stop retry delays on cancellation.

## [1.0.0] - Unreleased

First stable release. The SDK now covers every Bonyan-API endpoint with full TypeScript types, validation, retry/backoff and an open-source-ready project layout.

### Final-review fixes

- `HttpClient.raw()` now actually returns the parsed body (not the envelope), so `client.health()` resolves to `{ status, code, timestamp }`.
- `HttpClient.get()` raises a typed `BonyanRequestError` when the API returns a body without the expected `data` field instead of throwing a vague `TypeError`.
- `mergeSignals()` removes its abort listeners on every request, eliminating a slow leak when callers reuse a long-lived `AbortSignal`.
- User-initiated aborts are no longer retried.
- `BonyanApiError.fromResponse()` extracts a fallback message from plain-text / non-envelope error bodies (proxy 502, raw text 5xx).
- `ensureAyaNumber()` now bounds to 1..286 (max ayat in a single surah); use `ensureIntegerInRange('id', id, 1, TOTAL_AYAT)` for the global aya id (1..6236).
- Removed duplicate `.prettierrc` (kept `.prettierrc.json`).
- Examples (`examples/node/*.ts`) fixed to match the actual SDK shape (`list()` returns arrays directly, `azkar.listCategories()` not `azkar.categories()`, search results live under `.results` not `.data`).

### Added

- Nine fully-typed resources covering every Bonyan-API endpoint: `reciters`, `surah`, `ayat`, `azkar`, `tafsir`, `hadith`, `prayer`, `hijri`, `qibla`.
- Client-side argument validation with the new `ValidationError`.
- Automatic retry with exponential backoff + jitter on `5xx`, `429` and network errors.
- Honors the `Retry-After` header (seconds or HTTP-date).
- `userAgent` client option.
- `BaseResource` exported for advanced composition.
- TSDoc on every public class and method.
- Type guards: `isBonyanApiError`, `isBonyanRequestError`, `isValidationError`.
- ESLint config, Prettier config and `.editorconfig`.
- GitHub Actions: CI matrix (Node 20/22/24) and tag-driven release with npm provenance.
- Issue templates, PR template, Dependabot.
- Test suite covering the HTTP layer, validators, error classes and every resource.

### Changed

- `BonyanApiError` extends `Error` directly with a richer constructor (`status`, `code`, `requestId`, `retryAfterMs`, `body`).
- `BonyanRequestError` extends `Error` directly (was `NetworkError`).
- `HttpClient.get()` returns `data` directly; use `HttpClient.raw()` for the full envelope.
- Resource methods returning lists now return arrays directly (no extra wrapper object).

### Removed

- `ApiError` and `NetworkError` base classes (use `BonyanApiError` / `BonyanRequestError`).
- Implicit `cross-fetch` import - Node 18+ ships `fetch` natively.

## [0.1.0] - 2026-05-17

- Initial release with the `reciters` resource and the SDK foundation.

[1.0.0]: https://github.com/BonyanOSS/bonyan-sdk-js/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BonyanOSS/bonyan-sdk-js/releases/tag/v0.1.0
