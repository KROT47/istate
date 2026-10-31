import { JsObject } from '../types/index.js'

/**
 * Returns true if the given argument is an object from javascript perspective (typeof x === 'object')
 *
 * @param arg - unknown
 * @returns boolean
 *
 * @example
 * isJsObject({}) -> true
 * isJsObject([]) -> true
 * isJsObject(new Map()) -> true
 * isJsObject(new Set()) -> true
 *
 * @example
 * isJsObject(() => {}) -> false
 * isJsObject(null) -> false
 */
export function isObject(arg: unknown): arg is JsObject {
  return arg !== null && typeof arg === 'object'
}
