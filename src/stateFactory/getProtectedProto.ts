import {
  forEachReverse,
  get,
  getExplicitType,
  getZodDefaultValueObject,
  getZodObjectKeys,
  isFunction,
  isMapLastKey,
  isObject,
  PathValue,
  pick,
  PlainObject,
  set,
  VoidCallback,
  ZodObjectSchema,
  ZodSchemaSafeParseResult,
  zodSchemaGet,
  ZodSafeParseResult,
} from '../utils/index.js'
import { storage } from '../storage.js'
import shallowEqual from 'shallowequal'
import { subscribe } from 'valtio/vanilla'
import { z } from 'zod'

import {
  ExtensionsProtectedProto,
  protectedProtoExtensions,
  protoWithExtensions,
} from './extensions/index.js'
import type {
  BaseState,
  DefaultEventMap,
  DefaultStateEventMap,
  StateEvent,
  StateEventHandler,
  StatePath,
  StatePrototype,
  SystemData,
} from './types.js'
import { getVersionNumber } from './utils/index.js'
import { snapshot, subscribeKey, valtioStoreSymbol } from './valtioZod/index.js'

type BaseSubscribeCallback = Parameters<typeof subscribe>[1]
type BaseSubscribeCallbackArgs = Parameters<BaseSubscribeCallback>
type SubscribeCallback = (...args: BaseSubscribeCallbackArgs) => VoidCallback | void
type SubscribeKeyCallback<T extends object, K extends keyof T> = Parameters<
  typeof subscribeKey<T, K>
>[2]

export type ProtectedStateProto<
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = ExtensionsProtectedProto<S> & {
  get logger(): SystemData<S, CacheType, EventMap>['logger']

  get cache(): CacheType

  /**
   * Initializes state after client app is loaded.
   * Should not be called directly.
   *
   * May be overriden in stateFactory initialization (@see: methodsAllowedToBeOverriden)
   */
  init(): void | Promise<void>

  /**
   * Emits an event
   */
  emit<E extends keyof DefaultStateEventMap>(eventName: E, ...args: []): void
  emit<E extends StateEvent<EventMap>>(
    eventName: E,
    ...args: Parameters<StateEventHandler<E, EventMap>>
  ): void
  /**
   * Runs some cb only after state was initialized
   */
  runAfterInit(cb: VoidCallback): void
  getPathValue<P extends StatePath<S>>(path: P): PathValue<z.infer<S>, P>
  getPathProxyValue<P extends StatePath<S>>(path: P): PathValue<z.infer<S>, P>
  // @ts-ignore
  setPathValue<P extends StatePath<S>>(path: P, value: PathValue<z.infer<S>, P>): void
  getFullState(state?: z.infer<S>): z.infer<S>
  /**
   * Updates current state which will launch all subscribers
   */
  setState(obj: unknown): z.infer<S> | undefined
  /**
   * Returns parsed state
   */
  safeParse(obj: unknown): ZodSchemaSafeParseResult<S>
  /**
   * Returns parsed state
   */
  safeParsePath<P extends StatePath<S>>(
    path: P,
    obj: unknown
  ): ZodSafeParseResult<PathValue<z.infer<S>, P>>
  /**
   * Returns default state
   */
  getDefaultState(): z.infer<S>
  /**
   * Returns default value for state path
   */
  getPathDefaultState<P extends StatePath<S>>(path: P): PathValue<z.infer<S>, P>
  /**
   * Resets state path value to default state
   */
  resetPathToDefaultState<P extends StatePath<S>>(path: P): void
  /**
   * Subscribes to state changes
   *
   * Callback (cb) can return VoidCallback which will be executed after all next callbacks. This is useful to do some updates after all other callbacks were executed
   *
   * @example
   * state.subscribe(() => {
   *   console.log(1)
   *   return () => {
   *     console.log(4)
   *   }
   * })
   * state.subscribe(() => {
   *   console.log(2)
   *   return () => {
   *     console.log(3)
   *   }
   * })
   * => 1, 2, 3, 4 // order of execution
   */
  subscribe(cb: SubscribeCallback): ReturnType<typeof subscribe>
  subscribeKey<T extends z.infer<S>, K extends keyof T>(
    this: T,
    key: K,
    cb: SubscribeKeyCallback<T, K>
  ): ReturnType<typeof subscribeKey>
  /**
   * Subscribes to state changes using selector
   *
   * Runs subscribe under the hood
   */
  subscribeSelector<T>(
    selector: (state: z.infer<S>) => T,
    cb: (v: T, prevValue: T) => VoidCallback | void
  ): ReturnType<typeof subscribe>
  /**
   * Subscribes to state changes for path
   *
   * Runs subscribe under the hood
   */
  subscribePath<P extends StatePath<S>>(
    path: P,
    cb: (
      proxyValue: PathValue<z.infer<S>, P>,
      prevValue: PathValue<z.infer<S>, P>
    ) => VoidCallback | void
  ): ReturnType<typeof subscribe>

  /**
   * Checks if newValue is shallowly equal to current value and update value only if not
   */
  shallowCompareAndUpdate<P extends StatePath<S>>(path: P, newValue: PathValue<z.infer<S>, P>): void

  getFromLocalStorage(): object
  saveToLocalStorage(state?: z.infer<S>): void
}

export function getProtectedProto<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
>(schema: S): ProtectedStateProto<S, CacheType, EventMap> {
  const protectedProto = {
    get logger() {
      return this.__systemData.logger
    },

    get cache() {
      return this.__systemData.cache
    },

    init() {},

    emit(eventName, ...args) {
      this.runAfterInit(() => {
        // @ts-ignore
        this.__eventEmitter.emit(eventName, ...args)
      })
    },

    runAfterInit(cb: VoidCallback) {
      this.__systemData.afterInitQueue.push(cb)
      this.__runAfterInitQueue()
    },

    getPathValue(path) {
      return get(
        this.getSnap(),
        // @ts-ignore
        path
      )
    },

    getPathProxyValue(path) {
      return get(this[valtioStoreSymbol] as z.infer<S>, path)
    },

    setPathValue(path, value) {
      // @ts-ignore
      set(this, path, value)
    },

    getFullState(state) {
      const schemaState = pick(state ?? this.getSnap(), getZodObjectKeys(schema))
      return schemaState
    },

    setState(obj) {
      const result = this.safeParse(obj)
      if (!result.success) {
        return this.logger.error(`Error on '${this.id}' state update`, result.error)
      }
      Object.keys(this.schema.shape).forEach((key) => {
        if (key in result.data) {
          this[key] = result.data[key]
        } else {
          delete this[key]
        }
      })
      return result.data
    },

    safeParse(obj) {
      return this.schema.safeParse(obj)
    },

    safeParsePath(path, obj) {
      return zodSchemaGet(this.schema, path).safeParse(obj)
    },

    getDefaultState() {
      return getZodDefaultValueObject(this.schema, () => `Bad default values in '${this.id}'`)
    },

    getPathDefaultState(path) {
      return getZodDefaultValueObject(
        zodSchemaGet(this.schema, path),
        () => `Bad default values in '${this.id}'`
      )
    },

    resetPathToDefaultState(path) {
      // @ts-ignore
      set(this, path, this.getPathDefaultState(path))
    },

    subscribe(_cb) {
      const { subscribeCallbackMapping } = this.__systemData

      const cb: BaseSubscribeCallback = (...args) => {
        const { skipSubscriptionForVersion } = this.__systemData
        if (skipSubscriptionForVersion) {
          if (skipSubscriptionForVersion === getVersionNumber(this)) {
            return
          }
          delete this.__systemData.skipSubscriptionForVersion
        }

        const retCb = _cb(...args)
        if (isFunction(retCb)) {
          subscribeCallbackMapping.set(cb, retCb)
        }
        if (isMapLastKey(subscribeCallbackMapping, cb)) {
          // this is last callback in stack so we execute all returned callbacks in reverse order
          forEachReverse(subscribeCallbackMapping, (fn, key) => {
            if (!fn) return
            fn()
            subscribeCallbackMapping.set(key, null)
          })
        }
      }
      subscribeCallbackMapping.set(cb, null)
      const unsubscribeCb = subscribe(this[valtioStoreSymbol], cb)

      const unsubscribe = () => {
        unsubscribeCb()
        subscribeCallbackMapping.delete(cb)
      }
      return unsubscribe
    },

    subscribeKey(key, cb) {
      return subscribeKey(this, key, cb)
    },

    subscribeSelector(selector, cb) {
      const prevProxyValue = selector(this)

      const getState = (value) => (isObject(value) ? getVersionNumber(value) : value)
      const getValue = (value) => (isObject(value) ? snapshot(value) : value)

      let prevState = getState(prevProxyValue)
      let prevValue = getValue(prevProxyValue)

      return this.subscribe(() => {
        const proxyValue = selector(this)
        const state = getState(proxyValue)

        if (prevState === state) return
        const retCb = cb(proxyValue, prevValue as typeof proxyValue)

        prevState = getState(proxyValue)
        prevValue = getValue(proxyValue)

        return retCb
      })
    },

    subscribePath(path, cb) {
      return this.subscribeSelector(() => this.getPathProxyValue(path), cb)
    },

    shallowCompareAndUpdate(path, newValue) {
      const value = this.getPathValue(path)
      const parseResult = this.safeParsePath(path, newValue)

      if (parseResult.success) {
        const newPreparedValue = parseResult.data
        if (value === newPreparedValue) return

        const valueType = getExplicitType(value)
        const newValueType = getExplicitType(newPreparedValue)

        if (valueType === newValueType) {
          if (valueType === 'Array') {
            const valueArr = value as unknown[]
            const newValueArr = newPreparedValue as unknown[]
            if (
              valueArr.length === newValueArr.length &&
              valueArr.every((item, index) => shallowEqual(item, newValueArr[index]))
            ) {
              return
            }
          } else if (shallowEqual(value, newPreparedValue)) {
            return
          }
        }
      }

      this.setPathValue(path, newValue)
    },

    getFromLocalStorage() {
      return storage.getJson(this.__getUniqueId())
    },

    saveToLocalStorage(state) {
      storage.setJson(this.__getUniqueId(), this.getFullState(state))
    },
  } as BaseState<S, P, CacheType, EventMap>

  return protoWithExtensions(protectedProto, protectedProtoExtensions)
}
