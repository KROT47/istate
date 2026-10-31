import { ZodObjectSchema } from '../../utils/index.js'

import { getStateExtensionsSystemData } from './getStateExtensionsSystemData.js'

export type StateExtensionsSystemData<S extends ZodObjectSchema> = ReturnType<
  typeof getStateExtensionsSystemData<S>
>
