/**
 * Returns true if x is null
 *
 * @example
 * isNull(undefined) => false
 * isNull(null) => true
 * isNull(NaN) => false
 */
export function isNull(x: unknown): x is null {
  return x === null
}
