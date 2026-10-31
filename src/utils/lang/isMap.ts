import { getExplicitType } from '../getExplicitType.js'
import { _IntentionalAny } from '../types/index.js'

/**
 * Returns true if value is a Map
 *
 * @example
 * const s = new Map()
 * isMap(s) -> true
 */
export function isMap(value: unknown): value is Map<_IntentionalAny, _IntentionalAny> {
  return getExplicitType(value) === 'Map'
}
