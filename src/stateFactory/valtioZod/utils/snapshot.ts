import { isObject } from '../../../utils/index.js'
import { snapshot as vSnapshot } from 'valtio/vanilla'

import { valtioStoreSymbol } from '../constants.js'

type HandlePromise = Parameters<typeof vSnapshot>[1]

export function snapshot<T>(state: T, handlePromise?: HandlePromise): object | T {
  if (!isObject(state)) return state
  const valtioState = state[valtioStoreSymbol]
  if (!valtioState) return state
  return vSnapshot(valtioState, handlePromise)
}
