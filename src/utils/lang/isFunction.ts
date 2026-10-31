/**
 * Returns true if value is a function
 *
 * @example
 * const f = () => {}
 * isFunction(f) -> true
 */
export function isFunction<T extends Function>(value: unknown): value is T {
  return typeof value === 'function'
}
