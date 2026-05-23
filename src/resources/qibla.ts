import type { QiblaInfo } from '../types.js';
import { ensureLatitude, ensureLongitude } from '../validation.js';
import { BaseResource } from './base.js';

/**
 * Endpoint under `/qibla` — direction (in degrees from true north) to the Kaaba.
 *
 * @example
 * ```ts
 * const qibla = await client.qibla.getDirection(40.7128, -74.0060); // NYC
 * console.log(qibla.direction); // e.g. 58.48°
 * ```
 */
export class QiblaResource extends BaseResource {
  /** `GET /qibla?latitude=…&longitude=…` — qibla direction from a coordinate. */
  getDirection(latitude: number, longitude: number): Promise<QiblaInfo> {
    ensureLatitude(latitude);
    ensureLongitude(longitude);
    return this.http.get<QiblaInfo>('/qibla', { query: { latitude, longitude } });
  }
}
