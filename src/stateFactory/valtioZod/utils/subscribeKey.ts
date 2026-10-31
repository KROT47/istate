import { subscribeKey as vSubscribeKey } from 'valtio/vanilla/utils'

import { valtioStoreSymbol } from '../constants.js'

export const subscribeKey: typeof vSubscribeKey = (state, ...args) => {
  const valtioState = state[valtioStoreSymbol] ?? state
  return vSubscribeKey(valtioState, ...args)
}
