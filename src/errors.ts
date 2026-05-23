import type { BonyanErrorBody, BonyanErrorCode } from './types.js';

/**
 * Thrown when the Bonyan API returns a non-2xx response.
 *
 * @example
 * ```ts
 * try {
 *   await client.reciters.getById(999_999);
 * } catch (error) {
 *   if (error instanceof BonyanApiError) {
 *     console.error(error.status, error.code, error.requestId);
 *   }
 * }
 * ```
 */
export class BonyanApiError extends Error {
  readonly name = 'BonyanApiError';
  readonly status: number;
  readonly statusText: string | undefined;
  readonly code: BonyanErrorCode | undefined;
  readonly requestId: string | undefined;
  readonly retryAfterMs: number | undefined;
  readonly body: unknown;

  constructor(params: {
    status: number;
    message: string;
    statusText?: string | undefined;
    code?: BonyanErrorCode | undefined;
    requestId?: string | undefined;
    retryAfterMs?: number | undefined;
    body?: unknown;
  }) {
    super(params.message);
    this.status = params.status;
    this.statusText = params.statusText;
    this.code = params.code;
    this.requestId = params.requestId;
    this.retryAfterMs = params.retryAfterMs;
    this.body = params.body;
  }

  static fromResponse(
    status: number,
    body: unknown,
    statusText?: string,
    retryAfterMs?: number,
  ): BonyanApiError {
    const errorBody = isBonyanErrorBody(body) ? body : undefined;
    const message =
      errorBody?.error?.message ??
      errorBody?.message ??
      `Bonyan API request failed with status ${status}${statusText ? ` ${statusText}` : ''}`;

    return new BonyanApiError({
      status,
      message,
      ...(statusText !== undefined && { statusText }),
      ...(errorBody?.error?.code !== undefined && { code: errorBody.error.code }),
      ...(errorBody?.error?.requestId !== undefined && { requestId: errorBody.error.requestId }),
      ...(retryAfterMs !== undefined && { retryAfterMs }),
      body,
    });
  }
}

/**
 * Thrown when a request fails before reaching the API (network error, timeout, DNS).
 *
 * @example
 * ```ts
 * try {
 *   await client.reciters.list();
 * } catch (error) {
 *   if (error instanceof BonyanRequestError) {
 *     console.error('Network problem:', error.message);
 *   }
 * }
 * ```
 */
export class BonyanRequestError extends Error {
  readonly name = 'BonyanRequestError';
  readonly cause: unknown;

  constructor(message = 'Bonyan API request failed', cause?: unknown) {
    super(message);
    this.cause = cause;
  }

  static from(error: unknown): BonyanRequestError {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new BonyanRequestError('Bonyan API request timed out', error);
    }
    if (error instanceof Error) {
      return new BonyanRequestError(error.message, error);
    }
    return new BonyanRequestError('Bonyan API request failed', error);
  }
}

/**
 * Thrown when an argument fails client-side validation before a request is sent.
 *
 * @example
 * ```ts
 * try {
 *   await client.surah.getById(0);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error(`Invalid ${error.field}: ${error.message}`);
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
  readonly name = 'ValidationError';
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export function isBonyanApiError(error: unknown): error is BonyanApiError {
  return error instanceof BonyanApiError;
}

export function isBonyanRequestError(error: unknown): error is BonyanRequestError {
  return error instanceof BonyanRequestError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isBonyanErrorBody(value: unknown): value is BonyanErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === false
  );
}
