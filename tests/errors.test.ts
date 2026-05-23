import { describe, expect, it } from 'vitest';
import {
  BonyanApiError,
  BonyanRequestError,
  ValidationError,
  isBonyanApiError,
  isBonyanRequestError,
  isValidationError,
} from '../src/index.js';

describe('BonyanApiError', () => {
  it('fromResponse() extracts message, code and requestId from the envelope', () => {
    const error = BonyanApiError.fromResponse(404, {
      success: false,
      message: 'Reciter not found',
      error: { code: 'NOT_FOUND', message: 'Reciter not found', requestId: 'req_1' },
    });

    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.requestId).toBe('req_1');
    expect(error.message).toBe('Reciter not found');
  });

  it('falls back to a synthetic message when the body is not a valid envelope', () => {
    const error = BonyanApiError.fromResponse(500, 'oops', 'Internal Server Error');
    expect(error.status).toBe(500);
    expect(error.message).toContain('500');
    expect(error.code).toBeUndefined();
  });

  it('exposes retryAfterMs when provided', () => {
    const error = BonyanApiError.fromResponse(429, { success: false, message: 'rate' }, undefined, 1000);
    expect(error.retryAfterMs).toBe(1000);
  });
});

describe('BonyanRequestError', () => {
  it('detects AbortError as a timeout', () => {
    const abort = new DOMException('Aborted', 'AbortError');
    const error = BonyanRequestError.from(abort);
    expect(error.message).toBe('Bonyan API request timed out');
    expect(error.cause).toBe(abort);
  });

  it('preserves the original Error message', () => {
    const error = BonyanRequestError.from(new TypeError('fetch failed'));
    expect(error.message).toBe('fetch failed');
  });

  it('handles non-Error throwables', () => {
    const error = BonyanRequestError.from('string error');
    expect(error.message).toBe('Bonyan API request failed');
    expect(error.cause).toBe('string error');
  });
});

describe('type guards', () => {
  it('discriminate the three error types', () => {
    const api = BonyanApiError.fromResponse(500, null);
    const req = new BonyanRequestError('x');
    const val = new ValidationError('y', 'field');

    expect(isBonyanApiError(api)).toBe(true);
    expect(isBonyanApiError(req)).toBe(false);

    expect(isBonyanRequestError(req)).toBe(true);
    expect(isBonyanRequestError(api)).toBe(false);

    expect(isValidationError(val)).toBe(true);
    expect(isValidationError(api)).toBe(false);
  });
});
