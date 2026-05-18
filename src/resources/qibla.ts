import type { HttpClient } from '../http.js';
import type { QiblaInfo } from '../types.js';
import { validateLatitude, validateLongitude } from '../validation.js';

export class QiblaResource {
  constructor(private readonly http: HttpClient) {}

  getDirection(latitude: number, longitude: number): Promise<QiblaInfo> {
    validateLatitude(latitude);
    validateLongitude(longitude);
    return this.http.get('/qibla', { query: { latitude, longitude } });
  }
}
