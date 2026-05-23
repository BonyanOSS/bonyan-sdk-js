# Examples

Tiny runnable snippets that demonstrate every resource of the SDK.

- `simple.ts` — a 20-line tour covering the most common calls.
- `node/<resource>.ts` — one script per resource, end-to-end.

## Running

These examples import from `@bonyanoss/bonyan-api`, so they assume the package is installed (either from npm, or via `npm link`). From this repo:

```bash
pnpm build           # produce ./dist
pnpm pack            # creates a .tgz you can install elsewhere
```

Or, for local development, run a script with the published entry resolved to the local `dist/`:

```bash
# After pnpm build:
node --experimental-strip-types --no-warnings examples/simple.ts
```

Node 22+ ships TypeScript stripping behind that flag. On older Node versions, transpile first with `tsc` / `tsx`.

## Notes

- Every example uses the default base URL (`https://api.bonyanoss.org`).
- No API key is required — Bonyan-API is fully public.
- The `prayer.ts` example needs valid coordinates **or** a city/country pair. Both are demonstrated.
