import { ZodSchema } from './ZodSchema.js'

/**
 * Returns schema politics for what to do with keys which are not defined in schema
 *
 * @returns "passthrough" | "strict" | "strip" | undefined
 */
export function getZodSchemaUnknownKeysPolitics(schema: ZodSchema | undefined) {
  if (!schema || !('unknownKeys' in schema._def)) return undefined
  return schema._def.unknownKeys
}
