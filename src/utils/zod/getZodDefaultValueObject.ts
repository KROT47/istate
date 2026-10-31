import { z, ZodSchema } from 'zod'

/**
 * Returns default value object for zod schema or throws error
 */
export function getZodDefaultValueObject<S extends ZodSchema>(
  schema: S,
  getThrowMsg: (result: z.SafeParseReturnType<z.input<S>, z.infer<S>>) => string
): z.infer<S> {
  const result = schema.safeParse({})
  if (!result.success) {
    console.debug(result)
    throw Error(getThrowMsg(result))
  }
  return result.data
}
