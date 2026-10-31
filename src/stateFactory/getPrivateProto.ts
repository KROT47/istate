import { PlainObject, runCallbackQueue, ZodObjectSchema } from '../utils/index.js'
import { z } from 'zod'

import { systemDataKey } from './constants.js'
import { ExtensionsPrivateProto, privateProtoExtensions, protoWithExtensions } from './extensions/index.js'
import { DefaultEventMap, StatePrototype, SystemData, type BaseState } from './types.js'
import { getVersionNumber } from './utils/index.js'

export type PrivateStateProto<
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = ExtensionsPrivateProto<S> & {
  get __systemData(): SystemData<S, CacheType, EventMap>
  get __uniqueId(): SystemData<S, CacheType, EventMap>['uniqueId']
  get __eventEmitter(): SystemData<S, CacheType, EventMap>['eventEmitter']

  __getUniqueId(postfix?: string): string
  __init(): void
  /**
   * Same as setState but doesn't launch subscribers
   */
  __setStateQuietly(obj: unknown): z.infer<S> | undefined
  /**
   * Resets state to default
   */
  __resetState(): void
  __runAfterInitQueue(): void
  __checkClassIntegrity(): void

  /**
   * For debug purposes
   *
   * @example
   * this.__debug('address', ...)
   * this.__debug(this.id, ...)
   */
  __debug(stateId: string, ...args: unknown[]): void
}

const knownIds = new Set<string>()

export function getPrivateProto<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
>(): PrivateStateProto<S, CacheType, EventMap> {
  const privateProto = {
    get __systemData() {
      return this[systemDataKey]
    },

    get __uniqueId() {
      return this.__systemData.uniqueId
    },

    get __eventEmitter() {
      return this.__systemData.eventEmitter
    },

    __getUniqueId(postfix) {
      return `${this.__uniqueId}${postfix ? `_${postfix}` : ''}`
    },

    __init() {
      this.__checkClassIntegrity()

      if (this.localStorageSync) {
        const obj = this.getFromLocalStorage() ?? {}

        const defaultState = this.getDefaultState()

        const result = this.setState({ ...defaultState, ...obj })

        this.saveToLocalStorage(result ?? defaultState)

        this.on('reset', () => this.saveToLocalStorage())

        this.subscribe(() => {
          // return callback which will be executed after all other callbacks
          // check out how subscribe works
          return () => this.saveToLocalStorage()
        })
      }
    },

    __setStateQuietly(obj) {
      this.setState(obj)
      this.__systemData.skipSubscriptionForVersion = getVersionNumber(this)
    },

    __resetState() {
      this.setState(this.getDefaultState())
    },

    __runAfterInitQueue() {
      if (!this.isInitialized) return
      runCallbackQueue(this.__systemData.afterInitQueue)
    },

    // check for duplicate ids (only one instance of same id is allowed)
    __checkClassIntegrity() {
      const { id } = this
      if (!id) throw Error(`id is not defined in state`)

      if (knownIds.has(id)) {
        this.logger.critical(`Duplicate id '${id}' in state. This is ok on hot reload`)
      }
      knownIds.add(id)
    },

    __debug(stateId: string, ...args: unknown[]) {
      if (this.id !== stateId) return
      console.debug('### debug', this.__uniqueId, ...args)
    },
  } as BaseState<S, P, CacheType, EventMap>

  return protoWithExtensions(privateProto, privateProtoExtensions)
}
