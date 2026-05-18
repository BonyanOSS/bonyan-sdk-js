import type { BonyanErrorBody, BonyanErrorCode } from './types.js';

export class ApiError extends Error {
  readonly name: string = 'ApiError';
  readonly status: number;
  readonly statusText: string | undefined;
  readonly body?: unknown;
  readonly retryAfterMs: number | undefined;

  constructor(params: { status: number; statusText?: string | undefined; body?: unknown; message?: string | undefined; retryAfterMs?: number | undefined; }) {
    super(params.message ?? getApiErrorMessage(params.status, params.statusText, params.body));
    this.status = params.status;
    this.statusText = params.statusText;
    this.body = params.body;
    this.retryAfterMs = params.retryAfterMs;
  }
}

export class NetworkError extends Error {
  readonly name: string = 'NetworkError';
  readonly cause?: unknown;

  constructor(message = 'Bonyan API request failed', cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class ValidationError extends Error {
  readonly name: string = 'ValidationError';
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export class BonyanApiError extends ApiError {
  readonly name: string = 'BonyanApiError';
  readonly code: BonyanErrorCode | undefined;
  readonly requestId: string | undefined;

  constructor(params: { status: number; statusText?: string | undefined; body?: unknown; message?: string | undefined; retryAfterMs?: number | undefined; }) {
    super(params);
    const errorBody = isBonyanErrorBody(params.body) ? params.body : undefined;
    this.code = errorBody?.error?.code;
    this.requestId = errorBody?.error?.requestId;
  }

  static fromResponse( status: number, body: unknown, statusText?: string | undefined, retryAfterMs?: number | undefined,): BonyanApiError {
    return new BonyanApiError({ status, statusText, body, retryAfterMs });
  }
}

export class BonyanRequestError extends NetworkError {
  readonly name: string = 'BonyanRequestError';

  static from(error: unknown): BonyanRequestError {
    return new BonyanRequestError(getNetworkErrorMessage(error), error);
  }
}

export function isBonyanApiError(error: unknown): error is BonyanApiError {
  return error instanceof BonyanApiError;
}

export function isBonyanRequestError(error: unknown): error is BonyanRequestError {
  return error instanceof BonyanRequestError;
}

function getApiErrorMessage(status: number, statusText?: string, body?: unknown): string {
  if (isBonyanErrorBody(body)) {
    return body.error?.message ?? body.message ?? `Bonyan API request failed with status ${status}`;
  }

  if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }

  return `Bonyan API request failed with status ${status}${statusText ? ` ${statusText}` : ''}`;
}

function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Bonyan API request timed out';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Bonyan API request failed';
}

function isBonyanErrorBody(value: unknown): value is BonyanErrorBody {
  return typeof value === 'object' && value !== null && 'success' in value && value.success === false;
}