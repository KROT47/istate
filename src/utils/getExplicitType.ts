/**
 * Returns the explicit type of an object with first capital letter
 * e.g. Array, Object, Null, Undefined, Number, String, Arguments, Function, etc.
 */
export function getExplicitType(obj: unknown) {
  const dataType = Object.prototype.toString.call(obj).split(' ')[1]!
  return dataType.substring(0, dataType.length - 1)
}
