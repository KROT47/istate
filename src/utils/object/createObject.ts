export function createObject<
  Proto extends Record<string, unknown>,
  Obj extends Record<string, unknown>
>(proto: Proto, obj: Obj): Proto & Obj {
  return Object.create(proto, Object.getOwnPropertyDescriptors(obj))
}
