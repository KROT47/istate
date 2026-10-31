import { isNull } from './isNull.js'
import { isUndefined } from './isUndefined.js'

/**
 * Returns true if x is undefined or null
 *
 * @example
 * isNil(undefined) => true
 * isNil(null) => true
 * isNil(NaN) => false
 */
export function isNil(x: unknown): x is undefined | null {
  return isUndefined(x) || isNull(x)
}
