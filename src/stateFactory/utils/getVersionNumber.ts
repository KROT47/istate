import { getVersion } from '../valtioZod/index.js'

export function getVersionNumber(proxyValue: unknown | undefined): number {
  return getVersion(proxyValue) ?? -1
}
