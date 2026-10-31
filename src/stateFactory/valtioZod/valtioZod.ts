import {
  getZodSchemaShape,
  getZodSchemaUnknownKeysPolitics,
  getZodUnwrappedSchema,
  isObject,
  ZodSchema,
} from '../../utils/index.js'
import { proxy as vProxy } from 'valtio/vanilla'
import { z } from 'zod'

import { isProxySymbol, valtioStoreSymbol } from './constants.js'

type Config = {
  handleError?: (error: z.ZodError, prop: string | symbol, value: unknown) => void
}

const primitiveSchemaConstructors = [
  z.ZodString,
  z.ZodNumber,
  z.ZodBoolean,
  z.ZodNull,
  z.ZodUndefined,
  z.ZodDate,
  z.ZodBigInt,
  z.ZodSymbol,
  z.ZodLiteral,
  z.ZodEnum,
]

export function valtioZod<S extends ZodSchema>(schema: S, { handleError }: Config = {}) {
  primitiveSchemaConstructors.some((primitiveSchemaConstructor) => {
    if (schema instanceof primitiveSchemaConstructor) {
      throw Error('Schema cannot be a primitive')
    }
  })

  const proxy = <O extends z.input<S> & Record<string, unknown>>(obj: O) => {
    if (!isObject(obj)) {
      throw Error('must be an object, got:' + JSON.stringify(obj))
    }

    const result = schema.parse(obj)
    Object.setPrototypeOf(result, Object.getPrototypeOf(obj))

    const valtioProxy = vProxy(result)

    const createProxy = (target: object, schema: ZodSchema | undefined) => {
      const schemaShape = getZodSchemaShape(schema)
      const schemaKeys = new Set(schemaShape ? Object.keys(schemaShape) : [])

      const getPropInZodShape = (prop: string | symbol): string | undefined =>
        typeof prop === 'string' && schemaKeys.has(prop) ? prop : undefined

      const getZodInnerSchema = (prop: string | symbol): ZodSchema | undefined => {
        const shapeProp = getPropInZodShape(prop)
        return schemaShape && shapeProp
          ? (schemaShape[shapeProp] as unknown as ZodSchema)
          : undefined
      }

      const currentSchema = getZodUnwrappedSchema(schema)

      return new Proxy(target, {
        get(target, prop, receiver) {
          if (prop === valtioStoreSymbol) return target
          if (prop === isProxySymbol) return true

          const value = Reflect.get(target, prop, receiver)

          if (isObject(value)) {
            if (value[isProxySymbol]) return value

            const nextSchemaShape = getZodInnerSchema(prop)
            if (nextSchemaShape) {
              return createProxy(value, nextSchemaShape)
            }
          }

          return value
        },
        set(target, prop, value, receiver) {
          let finalValue = value

          if (!(prop in Object.getPrototypeOf(target))) {
            let propSchema: z.ZodTypeAny | undefined

            if (currentSchema instanceof z.ZodArray) {
              propSchema = currentSchema._def.type
            } else if (currentSchema instanceof z.ZodObject) {
              propSchema = currentSchema._def.shape()[prop as string]
            } else if (
              typeof currentSchema === 'object' &&
              typeof prop === 'string' &&
              prop in currentSchema
            ) {
              propSchema = currentSchema[prop]
            }

            if (propSchema) {
              const result = propSchema.safeParse(value)
              if (!result.success) {
                handleError?.(result.error, prop, value)
                return false
              }
              finalValue = result.data
            } else {
              const unknownKeysPolitics = getZodSchemaUnknownKeysPolitics(currentSchema)

              if (unknownKeysPolitics === 'strict') {
                throw Error(`Key '${String(prop)}' is not defined in schema`)
              }
              if (unknownKeysPolitics === 'strip') {
                return true
              }
            }
          }

          return Reflect.set(target, prop, finalValue, receiver)
        },
      })
    }

    const store = createProxy(valtioProxy, schema)

    return store as z.infer<S> & O
  }
  return { proxy }
}
