import { z } from 'zod'

import { ZodObjectSchema } from './ZodObjectSchema.js'

export type ZodSchema = ZodObjectSchema | z.ZodArray<z.ZodTypeAny>
