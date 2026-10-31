import { ZodSchema } from './ZodSchema.js'

export function getZodSchemaShape(schema: ZodSchema | undefined) {
  if (!schema || !('shape' in schema._def) || typeof schema._def.shape !== 'function') return
  return schema._def.shape()
}
