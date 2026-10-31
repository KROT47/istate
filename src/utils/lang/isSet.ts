import { getExplicitType } from '../getExplicitType.js'
import { _IntentionalAny } from '../types/index.js'

/**
 * Returns true if value is a Set
 *
 * @example
 * const s = new Set()
 * isSet(s) -> true
 */
export function isSet(value: unknown): value is Set<_IntentionalAny> {
  return getExplicitType(value) === 'Set'
}
