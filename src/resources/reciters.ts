import type { HttpClient } from '../http.js';
import type { Reciter, ReciterAudio } from '../types.js';

interface RecitersListData {
  reciters: Reciter[];
}

export class RecitersResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestInit): Promise<Reciter[]> {
    const data = await this.http.get<RecitersListData>('/reciters', options);
    return data.reciters;
  }

  async get(id: number, options?: RequestInit): Promise<Reciter> {
    return this.http.get<Reciter>(`/reciters/${id}`, options);
  }

  async search(name: string, options?: RequestInit): Promise<Reciter[]> {
    return this.http.get<Reciter[]>('/reciters/search', {
      ...options,
      query: { name },
    });
  }

  async getSurahAudio(reciterId: number, surah: number, options?: RequestInit): Promise<ReciterAudio> {
    return this.http.get<ReciterAudio>(`/reciters/${reciterId}/surah/${surah}`, options);
  }

  getReciters = this.list;
  getById = this.get;
  searchByName = this.search;
  getAudio = this.getSurahAudio;
}
