# Changelog

All notable changes to `@bonyanoss/bonyan-api` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — Unreleased

First stable release. The SDK now covers every Bonyan-API endpoint with full TypeScript types, validation, retry/backoff and an open-source-ready project layout.

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
- GitHub Actions: CI matrix (Node 18/20/22) and tag-driven release with npm provenance.
- Issue templates, PR template, Dependabot.
- Test suite covering the HTTP layer, validators, error classes and every resource.

### Changed

- `BonyanApiError` extends `Error` directly with a richer constructor (`status`, `code`, `requestId`, `retryAfterMs`, `body`).
- `BonyanRequestError` extends `Error` directly (was `NetworkError`).
- `HttpClient.get()` returns `data` directly; use `HttpClient.raw()` for the full envelope.
- Resource methods returning lists now return arrays directly (no extra wrapper object).

### Removed

- `ApiError` and `NetworkError` base classes (use `BonyanApiError` / `BonyanRequestError`).
- Implicit `cross-fetch` import — Node 18+ ships `fetch` natively.

## [0.1.0] — 2026-05-17

- Initial release with the `reciters` resource and the SDK foundation.

[1.0.0]: https://github.com/BonyanOSS/bonyan-sdk-js/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BonyanOSS/bonyan-sdk-js/releases/tag/v0.1.0
