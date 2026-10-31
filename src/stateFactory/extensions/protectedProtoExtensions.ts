import { ZodObjectSchema } from '../../utils/index.js'

export const protectedProtoExtensions: (() => object)[] = []

export type ExtensionsProtectedProto<S extends ZodObjectSchema> = {}
