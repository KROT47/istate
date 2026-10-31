import { _IntentionalAny, PlainObject, VoidCallback, ZodObjectSchema } from '../../../utils/index.js'

import { syncDefaultFieldDeletedAt, syncDefaultFieldUpdatedAt } from './constants.js'
import type { SyncPrivateStateProto } from './getSyncPrivateProto.js'
import { Sync } from './types.js'
import type { PublicStateProto } from '../../getPublicProto.js'
import type { AnySyncPath, BaseState, DefaultEventMap } from '../../types.js'

type ResetSyncCallback = VoidCallback

export type SyncPublicStateProto<S extends ZodObjectSchema> = {
  /**
   * Adds state sync with server side
   */
  addSync<
    SyncPath extends AnySyncPath<S>,
    RemoteSyncData,
    FieldUpdatedAt extends string = typeof syncDefaultFieldUpdatedAt,
    FieldDeletedAt extends string = typeof syncDefaultFieldDeletedAt
  >(
    sync: Sync<S, SyncPath, RemoteSyncData, FieldUpdatedAt, FieldDeletedAt>
  ): ResetSyncCallback

  /**
   * Force run sync
   */
  sync(): void
}

export function getSyncPublicProto<
  S extends ZodObjectSchema,
  EventMap extends DefaultEventMap
>(): SyncPublicStateProto<S> {
  return {
    addSync(sync) {
      // @ts-ignore
      const _sync = sync as Sync<S>
      this.runAfterInit(() => this.__initSync(_sync))
      return () => {
        const { syncHandlers } = this.__systemData
        const syncHandler = syncHandlers.get(sync.path)
        if (syncHandler) {
          syncHandler.unsubscribeSync()
          syncHandlers.delete(sync.path)
        }
      }
    },

    sync() {
      this.runAfterInit(() => this.__runSync())
    },
  } as BaseState<S, _IntentionalAny, PlainObject, EventMap> &
    PublicStateProto<S, _IntentionalAny, PlainObject, EventMap> &
    SyncPrivateStateProto<S>
}
