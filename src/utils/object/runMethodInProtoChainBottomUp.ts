export function runMethodInProtoChainBottomUp<O extends object, M extends keyof O>(
  obj: O,
  methodName: M
) {
  const protoStack: Function[] = []
  let proto = obj
  do {
    if (!Object.hasOwn(proto, methodName) || typeof proto[methodName] !== 'function') continue

    protoStack.push(proto[methodName])
  } while ((proto = Object.getPrototypeOf(proto)))

  let method
  while ((method = protoStack.pop())) method.call(obj)
}
