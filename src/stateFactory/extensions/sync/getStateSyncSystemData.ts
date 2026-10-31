import { ZodObjectSchema } from '../../../utils/index.js'

import { SyncHandlersMap } from './types.js'

export function getStateSyncSystemData<S extends ZodObjectSchema>(): {
  syncHandlers: SyncHandlersMap<S>
} {
  return {
    syncHandlers: new Map(),
  }
}
