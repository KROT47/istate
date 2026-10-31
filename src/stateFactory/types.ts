import type { StateLogger } from '../logger.js'
import {
  _IntentionalAny,
  AllPathsWhichExtend,
  EmptyObject,
  OmitByStrictValue,
  Paths,
  PathValue,
  PlainObject,
  RestrictKeys,
  VoidCallback,
  ZodObjectSchema,
} from '../utils/index.js'
import type { EventEmitter } from 'tseep'
import { AnyZodObject, z } from 'zod'

import type { StateExtensionsSystemData } from './extensions/types.js'
import type { PrivateStateProto } from './getPrivateProto.js'
import type { ProtectedStateProto } from './getProtectedProto.js'
import type { PublicStateProto } from './getPublicProto.js'
import type { DefaultEventMap } from './publicTypes.js'
import type { StateDefaults } from './stateFactory.js'

export * from './publicTypes.js'

export type AnyState = PublicStateProto<AnyZodObject, _IntentionalAny, PlainObject, DefaultEventMap>

export type StatePath<S extends ZodObjectSchema> = Paths<z.infer<S>>

export type AnySyncPath<S extends ZodObjectSchema> = AllPathsWhichExtend<z.infer<S>, object>

export type SyncPathValue<S extends ZodObjectSchema, SyncPath extends AnySyncPath<S>> = PathValue<
  z.infer<S>,
  // @ts-ignore
  SyncPath
>

export type SystemData<
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = StateExtensionsSystemData<S> & {
  /**
   * Tells the state to skip all subscriptions for the given version.
   * On subscription event we compare current version with the one to skip,
   * if they are equal we skip the event
   */
  skipSubscriptionForVersion?: number
  cache: CacheType
  readonly afterInitQueue: VoidCallback[]
  readonly subscribeCallbackMapping: Map<Function, VoidCallback | null>
  readonly uniqueId: string
  readonly logger: StateLogger
  readonly eventEmitter: EventEmitter<EventMap>
}

export type BaseState<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = StateDefaults<S> &
  PrivateStateProto<S, CacheType, EventMap> &
  ProtectedStateProto<S, CacheType, EventMap> &
  PublicStateProto<S, P, CacheType, EventMap>

export type StatePrototype<
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = ProtectedStateProto<S, CacheType, EventMap> & z.infer<S>

export type PublicState<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = PublicStateProto<S, P, CacheType, EventMap> & StateObject<P, S, CacheType, EventMap>

/**
 * All what is defined in state schema and state prototype
 */
export type StateObject<
  P extends StatePrototype<S, CacheType, EventMap>,
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = Omit<P, keyof BaseState<S, P, CacheType, EventMap>>

export type StateSnapshot<
  P extends StatePrototype<S, CacheType, EventMap>,
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends DefaultEventMap
> = OmitByStrictValue<PublicState<S, P, CacheType, EventMap>, Function>

export type DefaultStateEventMap = {
  /**
   * Fires when state should be set to default state, e.g. when user logged out
   */
  reset: () => void
  /**
   * Fires when state must be updated due to some important change, e.g. user was logged in
   */
  update: () => void
  /**
   * Fires when remote sync was finished
   */
  synced: () => void
}

export type FullEventMap<EventMap extends DefaultEventMap = EmptyObject> = DefaultStateEventMap &
  EventMap

export type StateEvent<EventMap extends DefaultEventMap = EmptyObject> =
  keyof FullEventMap<EventMap>

export type StateEventHandler<
  E extends StateEvent<EventMap>,
  EventMap extends DefaultEventMap = EmptyObject
> = FullEventMap<EventMap>[E]

export type BaseEventMap = RestrictKeys<DefaultEventMap, keyof DefaultStateEventMap>
