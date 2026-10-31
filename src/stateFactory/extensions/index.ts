import { stateProtoInitProp } from '../constants.js'

export * from './privateProtoExtensions.js'
export * from './protectedProtoExtensions.js'
export * from './publicProtoExtensions.js'

function extractInit(obj: object, inits: Function[]) {
  if (stateProtoInitProp in obj && typeof obj[stateProtoInitProp] === 'function') {
    inits.push(obj[stateProtoInitProp])
    delete obj[stateProtoInitProp]
  }
}

export function protoWithExtensions(proto: object, extensions: (() => object)[]) {
  const inits: Function[] = []
  extractInit(proto, inits)

  const extensionProto = extensions.reduce((extProto, getExtension) => {
    const extension = getExtension()
    extractInit(extension, inits)
    return Object.create(
      {},
      {
        ...Object.getOwnPropertyDescriptors(extProto),
        ...Object.getOwnPropertyDescriptors(extension),
      }
    )
  }, {})

  const initProto = {
    [stateProtoInitProp]() {
      for (const init of inits) init.call(this)
    },
  }

  return Object.create(
    {},
    {
      ...Object.getOwnPropertyDescriptors(proto),
      ...Object.getOwnPropertyDescriptors(extensionProto),
      ...Object.getOwnPropertyDescriptors(initProto),
    }
  )
}
