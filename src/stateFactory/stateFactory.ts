import {
  _IntentionalAny,
  createObject,
  EmptyObject,
  FilterStartingWith,
  mapValues,
  PlainObject,
  runMethodInProtoChainBottomUp,
  WithReadonlyProps,
  ZodObjectSchema,
} from '../utils/index.js'
import { scheduleStateInit } from '../initScheduler.js'

import { stateProtoInitProp, systemDataKey } from './constants.js'
import { getPrivateProto } from './getPrivateProto.js'
import { getProtectedProto } from './getProtectedProto.js'
import { getPublicProto, PublicStateProto } from './getPublicProto.js'
import type { BaseEventMap, BaseState, PublicState, StatePrototype } from './types.js'
import { getStateSystemData } from './utils/index.js'
import { valtioZod } from './valtioZod/index.js'

export type StateDefaults<S extends ZodObjectSchema> = {
  id: string
  schema: S
  localStorageSync?: boolean
}

const methodsAllowedToBeOverriden = new Set(['init', 'update', 'reset'])

export function stateFactory<
  S extends ZodObjectSchema,
  P extends StatePrototype<S, CacheType, EventMap>,
  const GK extends string,
  CacheType extends PlainObject,
  EventMap extends BaseEventMap = EmptyObject
>({
  cache,
  getters,
  setPrototype,
  loggerCategory,
  ...stateDefaults
}: StateDefaults<S> & {
  loggerCategory: string
  eventMap?: EventMap
  cache?: CacheType
  getters: GK[]
  setPrototype?: (
    baseProto: StatePrototype<S, CacheType, EventMap> &
      PublicStateProto<S, _IntentionalAny, CacheType, EventMap>
  ) => P
}) {
  const { id, schema } = stateDefaults
  const result = schema.safeParse({})
  if (!result.success) {
    throw Error('Not all default values were set in schema')
  }

  const { data } = result

  // is used to make TS wotk
  const fakeProtectedMethods = {}
  const stateProto = (setPrototype?.(fakeProtectedMethods as _IntentionalAny) ?? {}) as P

  checkStatePrototypeIntegrity(id, stateProto, getters)

  const p1 = createObject(stateDefaults, getPrivateProto())

  const p2 = createObject(p1, getProtectedProto<S, P, CacheType, EventMap>(schema))

  const p3 = createObject(p2, getPublicProto())

  const preparedStateProto = Object.create(
    null,
    mapValues(Object.getOwnPropertyDescriptors(stateProto), (value, key) => {
      if (key in p3 && typeof key === 'string') {
        if (!methodsAllowedToBeOverriden.has(key)) {
          throw Error(`Method '${key}' in state '${id}' conflicts with base proto method`)
        }
        if (!('value' in value)) {
          throw Error(`Method '${key}' in state '${id}' should be a function`)
        }
        return {
          ...value,
          value(...args) {
            p3[key].apply(this, args)
            value.value.apply(this, args)
          },
        }
      }

      return value
    })
  )

  const proto = createObject(p3, preparedStateProto)

  const systemProto = Object.create(proto, {
    [systemDataKey]: {
      value: getStateSystemData<S, CacheType, EventMap>({
        loggerCategory,
        id,
        cache: cache ?? ({} as CacheType),
      }),
      enumerable: false,
    },
  })

  const stateValue = createObject(systemProto, data) as PublicState<
    S,
    typeof stateProto,
    CacheType,
    EventMap
  >

  const state = valtioZod(schema).proxy(stateValue)

  scheduleStateInit(async () => {
    const finalState = state as unknown as BaseState<S, P, CacheType, EventMap>
    // run base __init for each proto since it can be defined for each of them
    runMethodInProtoChainBottomUp(finalState, stateProtoInitProp)
    await finalState.init()
    setTimeout(() => {
      finalState.isInitialized = true
      finalState.__runAfterInitQueue()
    }, 10)
  })

  type StateProto = typeof stateProto

  type FilteredStateProto = WithReadonlyProps<StateProto, GK>

  return state as Omit<
    PublicState<
      S,
      // @ts-ignore
      FilteredStateProto,
      CacheType,
      EventMap
    >,
    FilterStartingWith<keyof typeof stateProto, '_'>
  >
}

function checkStatePrototypeIntegrity(
  id: string,
  proto: Record<string, unknown>,
  getters?: string[]
) {
  const descriptors = Object.getOwnPropertyDescriptors(proto)
  // check that all getters names are defined in getters array
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (
      descriptor.get !== undefined &&
      descriptor.set === undefined &&
      (!getters || !getters.includes(key))
    ) {
      throw Error(`Missing '${key}' in state '${id}' getters array. Add "getters: ['${key}']"`)
    }
  }

  getters?.forEach((key) => {
    const descriptor = descriptors[key]
    if (
      !descriptor ||
      (descriptor.get !== undefined && descriptor.set !== undefined) ||
      descriptor.value !== undefined
    ) {
      throw Error(`Wrong value '${key}' in state '${id}' getters array. '${key}' is not getter`)
    }
  })

  Object.keys(proto).forEach((key) => {
    if (key.startsWith('__')) {
      throw Error(`Invalid property name: '${key}' in state '${id}. Do not use '__' prefix`)
    }
  })
}
