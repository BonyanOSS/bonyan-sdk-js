import { vi } from 'vitest';
import { BonyanClient } from '../src/index.js';
import type { BonyanFetch } from '../src/types.js';

export const TEST_BASE_URL = 'https://api.bonyanoss.org/bonyan-api/v1';

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  return jsonResponse({ success: true, data }, init);
}

export function fail(
  status: number,
  message: string,
  code = 'BAD_REQUEST',
  requestId = 'req_test',
): Response {
  return jsonResponse(
    { success: false, message, error: { code, message, requestId } },
    { status },
  );
}

export interface MockedClient {
  client: BonyanClient;
  fetchMock: ReturnType<typeof vi.fn>;
}

/**
 * Create a BonyanClient backed by a Vitest mock. The mock can return a single
 * response or be re-programmed per call by reading `fetchMock.mock.calls`.
 */
export function mockClient(response: Response | ((url: string, init: RequestInit) => Response | Promise<Response>)): MockedClient {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) =>
    typeof response === 'function' ? response(url, init) : response,
  ) as unknown as ReturnType<typeof vi.fn>;

  const client = new BonyanClient({
    baseUrl: TEST_BASE_URL,
    retry: 0,
    fetch: fetchMock as unknown as BonyanFetch,
  });

  return { client, fetchMock };
}
