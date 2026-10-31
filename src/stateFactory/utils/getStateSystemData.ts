import { getStateLogger } from '../../logger.js'
import { EmptyObject, PlainObject, ZodObjectSchema } from '../../utils/index.js'
import { EventEmitter } from 'tseep'

import { getStateUniqueId } from './getStateUniqueId.js'
import { getStateExtensionsSystemData } from '../extensions/getStateExtensionsSystemData.js'
import { BaseEventMap, SystemData } from '../types.js'

export function getStateSystemData<
  S extends ZodObjectSchema,
  CacheType extends PlainObject,
  EventMap extends BaseEventMap = EmptyObject
>({
  loggerCategory,
  id,
  cache,
}: {
  loggerCategory: string
  id: string
  cache: CacheType
}): SystemData<S, CacheType, EventMap> {
  return {
    ...getStateExtensionsSystemData(),
    cache,
    uniqueId: getStateUniqueId(id),
    afterInitQueue: [],
    subscribeCallbackMapping: new Map(),
    logger: getStateLogger([loggerCategory, 'state', id]),
    eventEmitter: new EventEmitter(),
  }
}
