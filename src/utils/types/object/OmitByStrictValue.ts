/**
 * Same as OmitByValue but compares values strictly (not deep).
 *
 * In contrast to OmitByPossibleValue which also allows for other types to be present.
 *
 * @example
 * OmitByStrictValue<{
 *   a: number | string | null,
 *   b: string,
 *   c: number,
 * }, number> => {
 *   a: number | string | null,
 *   b: string,
 * }
 */
export type OmitByStrictValue<O, V> = {
  [K in keyof O as O[K] extends V ? never : K]: O[K]
}
