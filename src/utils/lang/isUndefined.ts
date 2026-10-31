/**
 * Returns true if x is undefined
 *
 * @example
 * isUndefined(undefined) => true
 * isUndefined(null) => false
 * isUndefined(NaN) => false
 */
export function isUndefined(x: unknown): x is undefined {
  return x === undefined
}
