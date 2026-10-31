import { ZodObjectSchema } from '../../utils/index.js'

import { getSyncPublicProto, SyncPublicStateProto } from './sync/getSyncPublicProto.js'

export const publicProtoExtensions: (() => object)[] = [getSyncPublicProto]

export type ExtensionsPublicProto<S extends ZodObjectSchema> = SyncPublicStateProto<S>
