import { z } from 'zod'

import { getPathArray } from '../object/index.js'
import { MaybeArray } from '../types/index.js'

/**
 * Returns nested zod schema
 *
 * @example
 * const schema = z.object({
 *   a: z.object({
 *     a1: z.string(),
 *   }),
 * })
 *
 * const schema1 = zodSchemaGet(schema, 'a.a1')
 * or
 * const schema1 =  zodSchemaGet(schema, ['a', 'a1'])
 * => z.string()
 */
export function zodSchemaGet<Schema extends z.AnyZodObject>(
  schema: Schema,
  path: MaybeArray<string>
): z.ZodTypeAny {
  const keys = getPathArray(path)
  const nextSchema = schema.shape[keys[0]!]
  if (keys.length === 1) return nextSchema
  return zodSchemaGet(nextSchema, keys.slice(1))
}
