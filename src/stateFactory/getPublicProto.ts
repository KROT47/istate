import { PlainObject, VoidCallback, ZodObjectSchema } from '../utils/index.js'

import { ExtensionsPublicProto, protoWithExtensions, publicProtoExtensions } from './extensions/index.js'
import {
  DefaultEventMap,
  DefaultStateEventMap,
  StateEvent,
  StatePrototype,
  StateSnapshot,
  type BaseState,
} from './types.js'
import { callUseSnapshot } from './reactBinding.js'
import { snapshot } from './valtioZod/utils/snapshot.js'

type UnsubscribeCallback = VoidCallback

export type PublicStateProto<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = ExtensionsPublicProto<S> & {
  isInitialized: boolean

  on<E extends keyof DefaultStateEventMap>(
    eventName: E,
    handler: DefaultStateEventMap[E]
  ): UnsubscribeCallback
  on<E extends StateEvent<EventMap>>(eventName: E, handler: EventMap[E]): UnsubscribeCallback

  once<E extends keyof DefaultStateEventMap>(
    eventName: E,
    handler: DefaultStateEventMap[E]
  ): UnsubscribeCallback
  once<E extends StateEvent<EventMap>>(eventName: E, handler: EventMap[E]): UnsubscribeCallback

  off<E extends keyof DefaultStateEventMap>(eventName: E, handler: DefaultStateEventMap[E]): void
  off<E extends StateEvent<EventMap>>(eventName: E, handler: EventMap[E]): void

  /**
   * Returns state snapshot as plain object with access to all prototype props.
   *
   * WARNING: `this.getSnap()` does not support proper types due to circular dependency issue. Prefer `someState.getSnap()`
   */
  getSnap(): StateSnapshot<P, S, CacheType, EventMap>
  /**
   * Returns optimized state snapshot (uses proxy under the hood).
   *
   * WARNING: `this.useSnap()` does not support proper types due to circular dependency issue. Prefer `someState.useSnap()`
   */
  useSnap(): StateSnapshot<P, S, CacheType, EventMap>

  /**
   * Try to update state if possible
   *
   * May be overriden in stateFactory initialization (@see: methodsAllowedToBeOverriden).
   * Basic method will be called before the overriden one.
   */
  update(): void

  /**
   * Resets state to default values
   *
   * May be overriden in stateFactory initialization (@see: methodsAllowedToBeOverriden).
   * Basic method will be called before the overriden one.
   */
  reset(): void
}

export function getPublicProto<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
>(): PublicStateProto<S, P, CacheType, EventMap> {
  const publicProto = {
    isInitialized: false,

    on(eventName, handler): UnsubscribeCallback {
      this.__eventEmitter.on(eventName, handler)
      return () => this.__eventEmitter.off(eventName, handler)
    },

    once(eventName, handler): UnsubscribeCallback {
      // tseep drops once-listeners when a previous listener left an empty collection.
      const wrapped = (...args: unknown[]) => {
        this.__eventEmitter.off(eventName, wrapped as typeof handler)
        handler(...args)
      }
      this.__eventEmitter.on(eventName, wrapped as typeof handler)
      return () => this.__eventEmitter.off(eventName, wrapped as typeof handler)
    },

    off(eventName, handler) {
      this.__eventEmitter.off(eventName, handler)
    },

    getSnap() {
      return snapshot(this) as StateSnapshot<P, S, CacheType, EventMap>
    },

    useSnap() {
      return callUseSnapshot(this) as unknown as StateSnapshot<P, S, CacheType, EventMap>
    },

    update() {
      this.emit('update')
    },

    /**
     * Resets state to defaults
     */
    reset() {
      this.__resetState()
      this.emit('reset')
    },
  } as BaseState<S, P, CacheType, EventMap>

  return protoWithExtensions(publicProto, publicProtoExtensions)
}
