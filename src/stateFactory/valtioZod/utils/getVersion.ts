import { isObject } from '../../../utils/index.js'
import { getVersion as vGetVersion } from 'valtio/vanilla'

import { valtioStoreSymbol } from '../constants.js'

export function getVersion(value: unknown): number | undefined {
  const proxyValue = isObject(value) ? value[valtioStoreSymbol] : value
  return vGetVersion(proxyValue ?? value)
}
