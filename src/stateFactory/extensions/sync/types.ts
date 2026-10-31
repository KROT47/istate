import { MaybePromise, UnwrapMaybeArray, VoidCallback, ZodObjectSchema } from '../../../utils/index.js'
import { z } from 'zod'

import { syncDefaultFieldDeletedAt, syncDefaultFieldUpdatedAt } from './constants.js'
import { AnySyncPath, SyncPathValue } from '../../types.js'

export type SyncWithChangedAt<T, FieldUpdatedAt extends string, FieldDeletedAt extends string> = T &
  Partial<Record<FieldUpdatedAt | FieldDeletedAt, string>>

export type SyncUniqueKeyGetter<
  S extends ZodObjectSchema,
  SyncPath extends AnySyncPath<S>,
  SyncData = SyncPathValue<S, SyncPath>
> = (value: UnwrapMaybeArray<SyncData>) => string

export type Sync<
  S extends ZodObjectSchema,
  SyncPath extends AnySyncPath<S>,
  RemoteSyncData,
  FieldUpdatedAt extends string,
  FieldDeletedAt extends string,
  SyncData = SyncPathValue<S, SyncPath>
> = {
  /**
   * Path to value to sync (only object or array of objects are supported)
   *
   * @example 'user.settings'
   */
  path: SyncPath
  /**
   * Should produce unique key for each distinct object
   *
   * Equal objects should produce the same key
   */
  uniqueKeyGetter: SyncUniqueKeyGetter<S, SyncPath>
  /**
   * Field name in data object which tells time when object was updated
   *
   * Only for sending to server
   *
   * @default 'updatedAt'
   */
  fieldUpdatedAt?: FieldUpdatedAt
  /**
   * Field name in data object which tells time when object was deleted
   *
   * Only for sending to server
   *
   * @default 'deletedAt'
   */
  fieldDeletedAt?: FieldDeletedAt
  /**
   * Executed on sync error
   */
  errorHandler: (e: unknown) => void
  /**
   * Syncronisation handler
   *
   * @param syncData Data which is needed to be synced
   * @returns Resulting data
   */
  sync: (
    syncData: SyncData extends (infer R)[]
      ? SyncWithChangedAt<R, FieldUpdatedAt, FieldDeletedAt>[]
      : SyncWithChangedAt<SyncData, FieldUpdatedAt, FieldDeletedAt> | undefined,
    state: z.infer<S>
  ) => MaybePromise<RemoteSyncData>
}

type SyncHandlerConfig = {
  runSync: (force?: boolean) => void
  unsubscribeSync: VoidCallback
}

export type SyncHandlersMap<S extends ZodObjectSchema> = Map<AnySyncPath<S>, SyncHandlerConfig>

type SyncPath = string
type UniqueKey = string

export type SyncData<S extends ZodObjectSchema> = SyncPathValue<S, AnySyncPath<S>>

type OnlyObject<T> = T extends object ? T : never
export type SyncDataItem<S extends ZodObjectSchema> = OnlyObject<UnwrapMaybeArray<SyncData<S>>>

/**
 * @example
 * {
 *   [syncPath]: {
 *     lastSynced: Date
 *     data: {
 *       [uniqueKey]: {
 *         jsonStr: string // sync item as stringified json in ordered way to compare for updates
 *         updatedAt: Date
 *         deletedAt?: Date
 *       }
 *     }
 *   }
 * }
 */
export type PersistSyncObject = Record<SyncPath, PersistSyncState>

export type PersistSyncState = {
  lastSynced: string
  data: PersistSyncData
}

export type PersistSyncData = Record<UniqueKey, PersistSyncDataItem>

export type PersistSyncDataItem = SyncWithChangedAt<
  { jsonStr: string },
  typeof syncDefaultFieldUpdatedAt,
  typeof syncDefaultFieldDeletedAt
>
