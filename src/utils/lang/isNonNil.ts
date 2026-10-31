import { isNil } from './isNil.js'

/**
 * Returns true if x is NOT undefined or null
 *
 * @example
 * isNonNil(undefined) => false
 * isNonNil(null) => false
 * isNonNil(NaN) => true
 */
export function isNonNil<T>(x: T): x is NonNullable<T> {
  return !isNil(x)
}
