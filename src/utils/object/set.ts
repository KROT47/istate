import { getPathArray } from './getPathArray.js'
import { Paths, PathValue } from '../types/index.js'

export function set<T extends object, P extends Paths<T>, D extends PathValue<T, P>>(
  obj: T,
  path: P,
  value: D
): void {
  const pathArray = getPathArray(path)

  pathArray.reduce((acc, key, i) => {
    if (i === pathArray.length - 1) {
      acc[key] = value
    } else if (acc[key] === undefined) {
      acc[key] = isNaN(Number(key)) ? {} : []
    }
    return acc[key]
  }, obj)
}
