import { z } from 'zod'

export type ZodSafeParseResult<T extends unknown> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError }
