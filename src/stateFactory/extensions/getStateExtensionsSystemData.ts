import { ZodObjectSchema } from '../../utils/index.js'

import { getStateSyncSystemData } from './sync/getStateSyncSystemData.js'

export function getStateExtensionsSystemData<S extends ZodObjectSchema>() {
  return {
    ...getStateSyncSystemData<S>(),
  }
}
