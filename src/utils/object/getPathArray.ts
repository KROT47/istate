import { MaybeArray } from '../types/index.js'

const splitRegExp = /[[.\]]+/

export function getPathArray(path: MaybeArray<string>): string[] {
  return Array.isArray(path) ? path : path.split(splitRegExp)
}
