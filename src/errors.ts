import type { BonyanErrorBody, BonyanErrorCode } from './types.js';

export class BonyanApiError extends Error {
  readonly name = 'BonyanApiError';
  readonly status: number;
  readonly code: BonyanErrorCode | undefined;
  readonly requestId: string | undefined;
  readonly body: unknown | undefined;

  private constructor(params: {
    status: number;
    message: string;
    code: BonyanErrorCode | undefined;
    requestId: string | undefined;
    body: unknown | undefined;
  }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.body = params.body;
  }

  static fromResponse(status: number, body: unknown): BonyanApiError {
    const errorBody = isBonyanErrorBody(body) ? body : undefined;

    return new BonyanApiError({
      status,
      message: errorBody?.error?.message ?? errorBody?.message ?? `Bonyan API request failed with status ${status}`,
      code: errorBody?.error?.code,
      requestId: errorBody?.error?.requestId,
      body,
    });
  }
}

export class BonyanRequestError extends Error {
  readonly name = 'BonyanRequestError';
  readonly cause?: unknown;

  private constructor(message: string, cause?: unknown) {
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

export function isBonyanApiError(error: unknown): error is BonyanApiError {
  return error instanceof BonyanApiError;
}

export function isBonyanRequestError(error: unknown): error is BonyanRequestError {
  return error instanceof BonyanRequestError;
}

function isBonyanErrorBody(value: unknown): value is BonyanErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === false
  );
}
