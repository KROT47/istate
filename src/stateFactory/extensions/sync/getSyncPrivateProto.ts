import {
  _IntentionalAny,
  assignDefined,
  getValidDate,
  isDev,
  isObject,
  PlainObject,
  stringify,
  ZodObjectSchema,
} from '../../../utils/index.js'
import { storage } from '../../../storage.js'

import {
  syncDefaultFieldDeletedAt,
  syncDefaultFieldUpdatedAt,
  syncExtensionUniqueId,
} from './constants.js'
import type {
  PersistSyncData,
  PersistSyncDataItem,
  PersistSyncObject,
  PersistSyncState,
  Sync,
  SyncData,
  SyncDataItem,
} from './types.js'
import { AnySyncPath, BaseState, DefaultEventMap, StatePath } from '../../types.js'
import { getVersionNumber } from '../../utils/index.js'

type This<S extends ZodObjectSchema, EventMap extends DefaultEventMap> = BaseState<
  S,
  _IntentionalAny,
  PlainObject,
  EventMap
> &
  SyncPrivateStateProto<S>

export type SyncPrivateStateProto<S extends ZodObjectSchema> = {
  __init(): void
  __getPersistSyncObject(): PersistSyncObject
  __setPersistSyncObject(value: PersistSyncObject): void
  __getPersistSyncState(path: AnySyncPath<S>): PersistSyncState | undefined
  __setPersistSyncState(path: AnySyncPath<S>, value: PersistSyncState | undefined): void
  __runSync(force?: boolean): void
  /**
   * Initializes sync for state
   */
  __initSync(sync: Sync<S, AnySyncPath<S>, SyncData<S>, string, string>): void
  /**
   * Deinitialized sync for state
   */
  __resetSync(sync: Sync<S, AnySyncPath<S>, SyncData<S>, string, string>): void
}

export function getSyncPrivateProto<
  S extends ZodObjectSchema,
  EventMap extends DefaultEventMap
>(): SyncPrivateStateProto<S> {
  return {
    __init(this: This<S, EventMap>) {
      this.on('update', () => this.__runSync(true))
    },

    __runSync(this: This<S, EventMap>, force) {
      if (!this.isInitialized) return
      this.__systemData.syncHandlers.forEach(({ runSync }) => runSync(force))
    },

    __resetSync(this: This<S, EventMap>, sync) {
      this.__setPersistSyncState(sync.path, undefined)
    },

    __getPersistSyncObject(this: This<S, EventMap>) {
      const obj = storage.getJson<PersistSyncObject>(this.__getUniqueId(syncExtensionUniqueId))
      return isObject(obj) ? obj : {}
    },

    __setPersistSyncObject(this: This<S, EventMap>, value) {
      storage.setJson(this.__getUniqueId(syncExtensionUniqueId), value)
    },

    __getPersistSyncState(this: This<S, EventMap>, path) {
      return this.__getPersistSyncObject()[path as string]
    },

    __setPersistSyncState(this: This<S, EventMap>, path, value) {
      const persistData = this.__getPersistSyncObject()
      if (value === undefined) {
        delete persistData[path as string]
      } else {
        persistData[path as string] = value
      }
      this.__setPersistSyncObject(persistData)
    },

    __initSync(this: This<S, EventMap>, sync) {
      if (!this.isInitialized) return

      const {
        path,
        errorHandler,
        sync: syncRemoteData,
        fieldUpdatedAt = syncDefaultFieldUpdatedAt,
        fieldDeletedAt = syncDefaultFieldDeletedAt,
      } = sync
      const statePath = path as StatePath<S>

      if (isDev && this.__systemData.syncHandlers.has(path)) {
        this.logger.critical(`Sync for path '${path}' already exists in state`)
        return
      }

      // check that path data exists
      const pathData = this.getPathValue(statePath)
      if (!pathData) {
        this.logger.critical(`There should be default value for path '${path}'`)
        return
      }

      const asArray = Array.isArray(pathData)

      let isSyncing = false
      let shouldRunSyncAgain = false

      const _updatePersistSyncData = getPersistSyncDataUpdater(sync)
      const updatePersistSyncData = (persistData: PersistSyncData, dropDeleted = false) =>
        _updatePersistSyncData(persistData, this.getPathValue(statePath), dropDeleted)

      const runSync = async (force = false) => {
        if (isSyncing) {
          shouldRunSyncAgain = true
          return
        }
        isSyncing = true

        const _persistSyncState = this.__getPersistSyncState(path)
        // if no persistSyncState then force sync
        if (!_persistSyncState) force = true
        const persistSyncState = _persistSyncState ?? {
          data: updatePersistSyncData({}),
          lastSynced: new Date(0).toISOString(),
        }

        const lastSynced = new Date(persistSyncState.lastSynced)
        const preparedSyncData = Object.keys(persistSyncState.data)
          .reduce<PersistSyncDataItem[]>((acc, uniqueKey) => {
            const persistDataItem = persistSyncState.data[uniqueKey]!
            const deletedAt = getValidDate(persistDataItem[syncDefaultFieldDeletedAt])
            if (deletedAt && deletedAt > lastSynced) {
              acc.push(persistDataItem)
            } else {
              const updatedAt = getValidDate(persistDataItem[syncDefaultFieldUpdatedAt])
              if (updatedAt && updatedAt > lastSynced) {
                acc.push(persistDataItem)
              }
            }
            return acc
          }, [])
          .map(({ jsonStr, ...item }) => {
            try {
              return assignDefined(JSON.parse(jsonStr), {
                [fieldUpdatedAt]: item[syncDefaultFieldUpdatedAt],
                [fieldDeletedAt]: item[syncDefaultFieldDeletedAt],
              })
            } catch (error) {
              this.logger.critical('Error while parsing sync item', { error })
            }
          })
          .filter(Boolean)

        if (force || preparedSyncData.length) {
          const syncQueryData = asArray ? preparedSyncData : preparedSyncData[0]
          const baselineData = JSON.stringify(persistSyncState.data)
          const sentValue = stringify(this.getPathValue(statePath))
          // Publish before the request so an edit that lands while it is in flight is stored.
          this.__setPersistSyncState(path, persistSyncState)

          try {
            const remoteData = await syncRemoteData(
              syncQueryData as Parameters<typeof syncRemoteData>[0],
              this
            )
            // Edits made before this continuation are already on the proxy, but Valtio
            // may not have flushed the subscriber that writes persist yet.
            await Promise.resolve()
            const latest = this.__getPersistSyncState(path) ?? persistSyncState
            const valueChanged = sentValue !== stringify(this.getPathValue(statePath))

            if (valueChanged) {
              updatePersistSyncData(latest.data, false)
            } else {
              const dirtyBeforeApply = dirtyPersistKeys(baselineData, latest.data)
              this.setPathValue(
                statePath,
                mergeRemoteWithLocalEdits(
                  remoteData,
                  latest.data,
                  dirtyBeforeApply,
                  asArray,
                  sync.uniqueKeyGetter
                )
              )
              const dirtyEntries = Object.fromEntries(
                dirtyBeforeApply.map((key) => [key, latest.data[key]])
              ) as PersistSyncData
              updatePersistSyncData(latest.data, true)
              restoreDirtyDeletions(latest.data, dirtyEntries)
            }

            const dirtyKeys = dirtyPersistKeys(baselineData, latest.data)
            if (dirtyKeys.length) {
              const dirtyEntries = Object.fromEntries(
                dirtyKeys.map((key) => [key, latest.data[key]])
              ) as PersistSyncData
              latest.lastSynced = new Date(earliestDirtyAt(dirtyEntries) - 1).toISOString()
              shouldRunSyncAgain = true
            } else {
              latest.lastSynced = new Date().toISOString()
            }
            this.__setPersistSyncState(path, latest)
          } catch (error) {
            errorHandler(error)
          }

          if (shouldRunSyncAgain) {
            shouldRunSyncAgain = false
            queueMicrotask(runSync)
          }
        }

        isSyncing = false
        this.emit('synced')
      }

      runSync(true)

      let skipVersion

      const unsubscribeSync = this.subscribePath(statePath, () => {
        if (skipVersion && skipVersion === getVersionNumber(this)) {
          skipVersion = undefined
          return
        }

        const persistSyncState = this.__getPersistSyncState(path)
        if (persistSyncState) {
          updatePersistSyncData(persistSyncState.data)
          this.__setPersistSyncState(path, persistSyncState)
        }
        runSync()
      })

      const resetHandler = () => {
        // since state was resetted then we do not need to sync this version
        skipVersion = getVersionNumber(this)
        this.__resetSync(sync)
      }
      this.on('reset', resetHandler)

      this.__systemData.syncHandlers.set(path, {
        runSync,
        unsubscribeSync: () => {
          this.off('reset', resetHandler)
          unsubscribeSync()
        },
      })
    },
  }
}

function dirtyPersistKeys(baselineJson: string, latest: PersistSyncData) {
  const baseline = JSON.parse(baselineJson) as PersistSyncData
  return Object.keys(latest).filter((key) => {
    const before = baseline[key]
    const after = latest[key]
    if (!before || !after) return true
    return (
      before.jsonStr !== after.jsonStr ||
      before[syncDefaultFieldDeletedAt] !== after[syncDefaultFieldDeletedAt]
    )
  })
}

function earliestDirtyAt(entries: PersistSyncData) {
  const times = Object.values(entries).flatMap((entry) => {
    if (!entry) return []
    const updatedAt = getValidDate(entry[syncDefaultFieldUpdatedAt])
    const deletedAt = getValidDate(entry[syncDefaultFieldDeletedAt])
    return [updatedAt, deletedAt].flatMap((value) => (value ? [value.getTime()] : []))
  })
  return times.length ? Math.min(...times) : Date.now()
}

function restoreDirtyDeletions(latest: PersistSyncData, dirtyEntries: PersistSyncData) {
  Object.entries(dirtyEntries).forEach(([key, entry]) => {
    if (!entry?.[syncDefaultFieldDeletedAt]) return
    if (!latest[key]) latest[key] = entry
  })
}

function mergeRemoteWithLocalEdits<S extends ZodObjectSchema>(
  remoteData: unknown,
  persistData: PersistSyncData,
  dirtyKeys: string[],
  asArray: boolean,
  uniqueKeyGetter: (item: SyncDataItem<S>) => string
) {
  if (!dirtyKeys.length) return remoteData

  const dirty = new Set(dirtyKeys)
  if (asArray) {
    const remoteItems = Array.isArray(remoteData) ? remoteData : []
    const kept = remoteItems.filter(
      (item) => !dirty.has(uniqueKeyGetter(item as SyncDataItem<S>))
    )
    dirtyKeys.forEach((key) => {
      const entry = persistData[key]
      if (!entry?.[syncDefaultFieldDeletedAt]) {
        if (entry) kept.push(JSON.parse(entry.jsonStr))
      }
    })
    return kept
  }

  const entry = persistData[dirtyKeys[0]!]
  if (entry && !entry[syncDefaultFieldDeletedAt]) return JSON.parse(entry.jsonStr)
  return remoteData
}

function getPersistSyncDataUpdater<S extends ZodObjectSchema>(
  sync: Sync<S, AnySyncPath<S>, SyncData<S>, string, string>
) {
  const { uniqueKeyGetter, fieldUpdatedAt = syncDefaultFieldUpdatedAt } = sync

  const updatePersistSyncData = (
    persistData: PersistSyncData,
    data: SyncData<S>,
    dropDeleted = false
  ): PersistSyncData => {
    const existingUniqueIds = new Set(Object.keys(persistData))

    ;[data].flat().forEach((item) => {
      const syncDataItem = item as SyncDataItem<S>
      const uniqueKey = uniqueKeyGetter(syncDataItem)
      const persistDataItem = persistData[uniqueKey]

      existingUniqueIds.delete(uniqueKey)

      const jsonStr = stringify(item)

      if (!persistDataItem || jsonStr !== persistDataItem.jsonStr) {
        // is persistDataItem exists then item was updated by user
        const updatedAt = persistDataItem ? new Date() : getValidDate(syncDataItem[fieldUpdatedAt])

        persistData[uniqueKey] = {
          jsonStr,
          [syncDefaultFieldUpdatedAt]: (updatedAt ?? new Date()).toISOString(),
        }
      }
    })

    existingUniqueIds.forEach((uniqueKey) => {
      if (persistData[uniqueKey] === undefined) return

      if (dropDeleted) {
        delete persistData[uniqueKey]
      } else {
        persistData[uniqueKey][syncDefaultFieldDeletedAt] = new Date().toISOString()
      }
    })

    return persistData
  }

  return updatePersistSyncData
}
