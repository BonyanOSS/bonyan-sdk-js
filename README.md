# Bonyan-API JavaScript SDK

Official JavaScript and TypeScript SDK for [Bonyan-API](https://github.com/BonyanOSS/Bonyan-API).

The SDK is a small typed client around:

```txt
https://api.bonyanoss.org/bonyan-api/v1
```

It uses the Bonyan-API service directly, so fallback, caching, and source handling stay centralized in the API.

## Install

```bash
npm install @bonyanoss/bonyan-api
pnpm add @bonyanoss/bonyan-api
yarn add @bonyanoss/bonyan-api
```

## Usage

```ts
import { BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

const reciters = await bonyan.reciters.list();
const reciter = await bonyan.reciters.get(1);
const matches = await bonyan.reciters.search('العفاسي');
const audio = await bonyan.reciters.getSurahAudio(1, 1);
```

## Custom Client

```ts
const bonyan = new BonyanClient({
  baseUrl: 'https://api.example.com',
  timeoutMs: 10_000,
});
```

## Errors

```ts
import { BonyanApiError, BonyanClient } from '@bonyanoss/bonyan-api';

const bonyan = new BonyanClient();

try {
  await bonyan.reciters.get(999999);
} catch (error) {
  if (error instanceof BonyanApiError) {
    console.log(error.status, error.code, error.requestId);
  }
}
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Current Scope

This first version intentionally includes only the SDK foundation and the `reciters` resource as the example pattern. New resources should follow the same structure in `src/resources`.
