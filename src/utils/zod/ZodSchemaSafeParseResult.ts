import { z } from 'zod'

import { ZodSafeParseResult } from './ZodSafeParseResult.js'

export type ZodSchemaSafeParseResult<Schema extends z.ZodType<unknown>> = ZodSafeParseResult<
  z.infer<Schema>
>
