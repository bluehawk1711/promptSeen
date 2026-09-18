/**
 * App update utilities — version comparison + force-update decision.
 *
 * Shared between the mobile app (which checks on launch) and the admin
 * panel (which previews what users will see).
 */

import type { AppSettings } from './types.js';

/**
 * Compare two semver strings ("1.2.3" style).
 * Returns negative if a < b, 0 if equal, positive if a > b.
 * Tolerates prefixes like "v1.2.3" and build suffixes like "1.2.3+19".
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('+')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export type UpdateRequirement = 'none' | 'soft' | 'hard';

/**
 * Decide what update prompt (if any) a device should see.
 *
 * - `hard` — current version < minVersion: blocking update required
 * - `soft` — current version < latestVersion: optional update banner
 * - `none` — up to date, or updateMode disabled
 */
export function getUpdateRequirement(
  currentVersion: string,
  settings: Pick<AppSettings, 'latestVersion' | 'minVersion' | 'updateMode'>
): UpdateRequirement {
  if (settings.updateMode === 'none') return 'none';

  const needsMin = compareVersions(currentVersion, settings.minVersion) < 0;
  if (needsMin && settings.updateMode === 'hard') return 'hard';

  const hasNewer = compareVersions(settings.latestVersion, currentVersion) > 0;
  if (hasNewer && settings.updateMode === 'soft') return 'soft';

  // updateMode 'hard' but version >= minVersion → nothing required
  if (needsMin) return 'hard';
  return 'none';
}
