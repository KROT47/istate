import { ZodObjectSchema } from '../../utils/index.js'

import { getSyncPrivateProto, SyncPrivateStateProto } from './sync/getSyncPrivateProto.js'

export const privateProtoExtensions: (() => object)[] = [getSyncPrivateProto]

export type ExtensionsPrivateProto<S extends ZodObjectSchema> = SyncPrivateStateProto<S>
