import { ZodSchema } from './ZodSchema.js'

export function getZodUnwrappedSchema(schema: ZodSchema | undefined): ZodSchema | undefined {
  if (!schema) return
  let result = schema
  // @ts-ignore
  while (result._def?.innerType) result = result._def.innerType
  return result
}
