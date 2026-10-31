import { useSnapshot as useVSnapshot } from 'valtio/react'

import { registerUseSnapshot } from './stateFactory/reactBinding.js'
import { valtioStoreSymbol } from './stateFactory/valtioZod/constants.js'

export const useSnapshot: typeof useVSnapshot = (state, ...args) => {
  const store =
    (state as typeof state & Record<symbol, typeof state | undefined>)[valtioStoreSymbol] ?? state
  return useVSnapshot(store, ...args)
}

registerUseSnapshot((state) => useSnapshot(state as never))
