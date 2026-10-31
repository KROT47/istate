import { getPathArray } from './getPathArray.js'
import { isNonNil } from '../lang/index.js'
import { Paths, PathValue } from '../types/index.js'

/**
 * Returns object preperty value using path
 * e.g.
 *
 *  get({ a: { b: { c: 1 } } }, 'a.b.c') -> 1
 *
 *  get({ a: { b: { c: 1 } } }, ['a', 'b', 'c'] as const) -> 1
 *
 *  get({ a: { b: { c: 1 } } }, 'a.b.d') -> undefined
 *
 *  get({ a: { b: { c: 1 } } }, 'a.b.d', 0) -> 0
 */
export function get<O extends object, P extends Paths<O>, D extends unknown>(
  obj: O | undefined,
  path: P | keyof O,
  defValue?: D
): undefined extends PathValue<O, P>
  ? undefined extends D
    ? PathValue<O, P>
    : NonNullable<PathValue<O, P>> | D
  : PathValue<O, P> {
  if (obj) {
    const result = (
      typeof path === 'number' || typeof path === 'symbol'
        ? obj[path as keyof O]
        : getPathArray(path).reduce((prevObj, key) => prevObj && prevObj[key], obj)
    ) as PathValue<O, P>

    if (isNonNil(result)) return result
  }

  // @ts-ignore
  return defValue
}
