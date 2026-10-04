# Contributing to @bonyanoss/bonyan-api

Thanks for taking the time to contribute! :tada: This guide explains how the project is laid out, how to set it up locally, and the conventions we follow so your PR can be reviewed and merged quickly.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Project layout](#project-layout)
- [Local setup](#local-setup)
- [Scripts](#scripts)
- [Adding a new resource](#adding-a-new-resource)
- [Coding conventions](#coding-conventions)
- [Tests](#tests)
- [Commit messages](#commit-messages)
- [Pull request checklist](#pull-request-checklist)
- [Release process](#release-process)

---

## Code of conduct

Be kind, be inclusive, prefer code over opinions. By participating you agree to keep the conversation respectful.

---

## Project layout

```txt
bonyan-sdk-js/
├── src/
│   ├── client.ts          # BonyanClient — public entry
│   ├── http.ts            # Internal HTTP client (fetch, retry, timeout, errors)
│   ├── errors.ts          # BonyanApiError, BonyanRequestError, ValidationError
│   ├── validation.ts      # Shared argument validators
│   ├── types.ts           # All public types and envelopes
│   ├── index.ts           # Re-exports — this is the public surface
│   └── resources/
│       ├── base.ts        # BaseResource — extend this for new resources
│       ├── ayat.ts        # One file per Bonyan-API module
│       ├── azkar.ts
│       ├── hadith.ts
│       ├── hijri.ts
│       ├── prayer.ts
│       ├── qibla.ts
│       ├── reciters.ts
│       ├── surah.ts
│       └── tafsir.ts
├── tests/
│   ├── helpers.ts         # mockClient(), ok(), fail()
│   ├── reciters.test.ts
│   ├── resources.test.ts  # one describe() per resource
│   ├── http.test.ts
│   ├── validation.test.ts
│   └── errors.test.ts
├── examples/
└── .github/workflows/     # CI + release
```

Three layers and one rule:

1. **`http.ts`** does networking and never knows about resources.
2. **`resources/*.ts`** define endpoints and validate inputs — no networking logic.
3. **`client.ts`** wires resources together. Users only import from `index.ts`.

If you need to touch more than one layer, that's usually a sign the change needs to be split into smaller PRs.

---

## Local setup

Use **Node.js 22.13 or a supported Node 24 release** for development and the **pnpm version in package.json**. ESLint 10 requires Node 22.13; the SDK itself supports Node 22.12. Install pnpm globally if needed:

```bash
npm install -g pnpm
```

Clone and install:

```bash
git clone https://github.com/BonyanOSS/bonyan-sdk-js.git
cd bonyan-sdk-js
pnpm install
```

Run the test suite to confirm everything works:

```bash
pnpm test
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm build` | Bundle ESM + CJS + d.ts into `dist/` |
| `pnpm dev` | Same as `build`, in watch mode |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage (writes `coverage/`) |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm lint` | ESLint + Prettier check |
| `pnpm format` | Auto-format with Prettier |
| `pnpm clean` | Remove `dist/` and `coverage/` |

---

## Adding a new resource

Bonyan-API exposes resources under namespaced URLs (e.g. `/qibla`, `/prayer/times`). To add a new one:

### 1. Create the resource file

Put it at `src/resources/<name>.ts`. Extend `BaseResource`, add JSDoc with at least one usage example, validate inputs through helpers from `validation.ts`, and let `HttpClient` unwrap the envelope.

```ts
// src/resources/myresource.ts
import type { MyType } from '../types.js';
import { ensurePositiveInteger } from '../validation.js';
import { BaseResource } from './base.js';

/**
 * Endpoints under `/myresource` — what it does in one sentence.
 *
 * @example
 * ```ts
 * const item = await client.myResource.getById(1);
 * ```
 */
export class MyResource extends BaseResource {
  /** `GET /myresource/:id` — fetch a single item by id. */
  getById(id: number): Promise<MyType> {
    ensurePositiveInteger('id', id);
    return this.http.get<MyType>(`/myresource/${id}`);
  }
}
```

### 2. Add the type(s)

In `src/types.ts`, under the right `// ─── <Section> ───` comment block.

### 3. Wire it into the client

In `src/client.ts`:

```ts
readonly myResource: MyResource;
// …
this.myResource = new MyResource(this.http);
```

And re-export in `src/index.ts`:

```ts
export { MyResource } from './resources/myresource.js';
```

### 4. Test it

Add a `describe('MyResource', () => {})` block in `tests/resources.test.ts`. Cover:

- the happy path (returns the expected shape)
- input validation (throws `ValidationError` on bad input)
- URL-encoding when path params contain Arabic / special chars

### 5. Document it

Add a row to the resource table in `README.md`.

---

## Coding conventions

- **TypeScript first.** No `any`. No `// @ts-ignore`. Prefer `unknown` and narrow with type guards.
- **Validate at the boundary.** Resources validate every argument before calling `http.get`.
- **No comments that restate the code.** A JSDoc on a public method is great; `// increment i` is noise.
- **Endpoint comments.** Every public resource method has a one-line JSDoc starting with the HTTP verb and path (`/** \`GET /surah/:id\` — fetch a surah. */`).
- **No surprise mutations.** Resources are stateless. Don't cache things on `this`.
- **Formatting is automated.** Run `pnpm format` before pushing. CI rejects unformatted code.

---

## Tests

We use **Vitest**. Test files live in `tests/` and end with `.test.ts`.

Use `mockClient()` from `tests/helpers.ts` to spin up a `BonyanClient` backed by a fetch mock:

```ts
import { describe, expect, it } from 'vitest';
import { mockClient, ok } from './helpers.js';

it('list() returns the unwrapped payload', async () => {
  const { client, fetchMock } = mockClient(ok({ items: [] }));
  await client.myResource.list();
  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.bonyanoss.org/myresource',
    expect.anything(),
  );
});
```

Aim for ≥ 80% coverage (enforced in CI).

---

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```md
<type>(<scope>): <short summary>
```

| Type | Use for |
| --- | --- |
| `feat` | New user-facing functionality |
| `fix` | Bug fix |
| `docs` | README, JSDoc, examples |
| `refactor` | Internal change with no behavior diff |
| `test` | Tests only |
| `build` | tsup, package.json, lockfile |
| `ci` | GitHub Actions, Dependabot |
| `chore` | Anything else |

Examples:

- `feat(reciters): add getSurah() method`
- `fix(http): honor Retry-After header on 429`
- `docs(readme): document custom fetch option`

---

## Pull request checklist

Before opening a PR:

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (new tests added for new behavior)
- [ ] Public API changes are reflected in the README and JSDoc
- [ ] No breaking changes — or they're called out in the PR description

CI runs on every PR and must be green before merge.

---

## Release process

Releases are tag-driven. Maintainers:

1. Bump the version in `package.json` (`pnpm version <patch|minor|major>`).
2. Update `CHANGELOG.md`.
3. Push the tag — the `release.yml` workflow publishes to npm with provenance.

```bash
pnpm version minor
git push --follow-tags
```

That's it. Thanks again for contributing! :sparkles:
