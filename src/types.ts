export type BonyanFetch = typeof fetch;

export interface BonyanClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  headers?: HeadersInit;
  fetch?: BonyanFetch;
}

export interface BonyanSuccessBody<T> {
  success: true;
  data: T;
}

export type BonyanErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'ALL_SOURCES_FAILED' | 'INTERNAL_ERROR' | string;

export interface BonyanErrorBody {
  success: false;
  message: string;
  error?: {
    code?: BonyanErrorCode;
    message?: string;
    requestId?: string;
  };
}

export type ReciterSource = 'mp3quran.net' | 'quran.com';

export interface ReciterMoshaf {
  id: number;
  name: string;
  server: string;
}

export interface Reciter {
  id: number;
  name: string;
  date?: string;
  moshaf?: ReciterMoshaf[];
  style?: string | null;
  apiName: ReciterSource;
}

export interface ReciterAudio {
  reciter: string;
  surah: number;
  audio: string;
}
