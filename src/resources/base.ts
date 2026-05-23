import type { HttpClient } from '../http.js';

/**
 * Common ancestor for every Bonyan resource. Holds the shared {@link HttpClient}
 * so concrete resources only have to declare their endpoints.
 *
 * New resources should extend this class — see CONTRIBUTING.md.
 */
export abstract class BaseResource {
  constructor(protected readonly http: HttpClient) {}
}
