import { ZodObjectSchema } from './ZodObjectSchema.js'

export function getZodObjectKeys<T extends ZodObjectSchema>(schema: T): string[] {
  return schema.keyof().options
}

// z.ZodObject<z.ZodRawShape>
