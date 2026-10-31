/**
 * Unwraps array if T is array, otherwise returns T
 *
 * @example
 * UnwrapMaybeArray<number> => number
 * UnwrapMaybeArray<number[]> => number
 */
export type UnwrapMaybeArray<T> = T extends (infer U)[] ? U : T
