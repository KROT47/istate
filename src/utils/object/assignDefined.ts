import { assignDefined_excessivelyDeep } from './assignDefined_excessivelyDeep.js'
import { PickAllDefined } from '../types/index.js'

export function assignDefined<T, U>(target: T, source: U): PickAllDefined<T & U>
export function assignDefined<T, U, V>(target: T, source1: U, source2: V): PickAllDefined<T & U & V>
export function assignDefined<T, U, V, W>(
  target: T,
  source1: U,
  source2: V,
  source3: W
): PickAllDefined<T & U & V & W>
export function assignDefined(target: object, ...sources: object[]): object {
  return assignDefined_excessivelyDeep(target, ...sources)
}
