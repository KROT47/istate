import type {
  Booleans,
  Call,
  ComposeLeft,
  Fn,
  Objects,
  Pipe,
  Strings,
  Tuples,
  Unions,
} from 'hotscript'

import type { _IntentionalAny } from './utils/index.js'

export type * from 'hotscript'

export type EmptyObject = {}

export type PrimitiveKeys = string | number | symbol

export type PrimitiveValues = PrimitiveKeys | null | undefined | boolean

// see isPlainObject for examples
export type PlainObject = Record<PrimitiveKeys, _IntentionalAny>

/**
 * Built-in types that should not be recursed when mapping objects
 */
export type Builtin = Date | RegExp | Function | Error

/**
 * All values that can be serialized
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

/**
 * Represents object that can be serialized
 */
export type SerializablePlainObject = Record<string | number, Serializable>

export type PlainStringObject = Record<string, string>

// see isPlainObjectOrArray for examples
export type PlainObjectOrArray = PlainObject | _IntentionalAny[]

/**
 * Object from javascript perspective (typeof x === 'object')
 *
 * In contrast to typescript object (typeof x extends object) which also extends to Function
 */
export type JsObject =
  | PlainObject
  | Set<_IntentionalAny>
  | Map<_IntentionalAny, _IntentionalAny>
  | _IntentionalAny[]

type _Exact<T, Shape extends T> = T & { [K in keyof Shape]: K extends keyof T ? T[K] : never }
export type Exact<T> = _Exact<T, T>

/**
 * Make object mutable (opposite of Readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Make object mutable recursively
 */
export type MutableDeep<T> = T extends (infer U)[]
  ? MutableDeep<U>[]
  : T extends object
  ? { -readonly [P in keyof T]: MutableDeep<T[P]> }
  : T

/**
 * Allow to use any string but adds autocomplete of type T
 *
 * @example
 * type A = AnyStringOr<'a'> // will provide autocomplete for 'a'
 */
export type AnyStringOr<T> = T | (string & {})

/**
 * Returns new union of values that are in T but not in U
 *
 * @example
 * UnionDifference<
 *   'a' | 'b' | 'c' | 'd',
 *   'a'       | 'c'        | 'z'
 * > => 'b' | 'd'
 */
export type UnionDifference<
  T extends string | number | symbol,
  U extends string | number | symbol
> = ({
  [K in T]: K
} & {
  [K in U]: never
})[T]

/**
 * Restrict to use keys in object
 *
 * @example
 * type NoAB = RestrictKeys<{ [key: string]: number }, 'a' | 'b'>
 * const x: NoAB = { a: 1 } // Error
 * const x: NoAB = { c: 1 } // OK
 */
export type RestrictKeys<Obj extends object, Keys extends string> = Obj &
  Partial<Record<Keys, never>>

export type FilterStartingWith<Set, Needle extends string> = Set extends `${Needle}${infer _X}`
  ? Set
  : never

export type FilterNotStartingWith<Set, Needle extends string> = Set extends `${Needle}${infer _X}`
  ? never
  : Set

export type WithReadonlyProps<
  T extends Record<string, unknown>,
  S extends keyof T
> = string extends S
  ? T
  : Omit<T, S> & {
      readonly [P in S]: T[P]
    }

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

/**
 * Require at least one property
 *
 * const x: RequireAtLeastOne<{ a: number, b: string }> = { a: 1 } // OK
 *
 * const x: RequireAtLeastOne<{ a: number, b: string }> = { b: '1' } // OK
 *
 * const x: RequireAtLeastOne<{ a: number, b: string }> = {} // Error
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

export type VoidCallback = (...args: never[]) => void

export type LiteralOrString<T extends string> = T | (string & {})

export type Maybe<T> = T | undefined | null

export type MaybeUndefined<T> = T | undefined

export type MaybeNull<T> = T | null
export type MaybePromise<T> = T | Promise<T>

export type MaybeArray<T> = T | T[]

export type MaybeReadonly<T> = T | Readonly<T>

export type MaybeGetter<T, A extends unknown[] = never> = T | ((...args: A) => T)

/**
 * Join<'a', 'b'>
 * => 'a.b'
 * Join<'a', 0>
 * => 'a.0'
 */
export type JoinPath<P> = Call<Tuples.Join, '.', P>

/**
 * PathStrings<typeof { a: { b: 1 }, b: 1 }>
 * => 'a' | 'a.b' | 'b'
 */
export type PathStrings<T> = Call<Objects.AllPaths, T>

/**
 * PathsTuples<typeof { a: { b: 1 }, b: 1 }>
 * => ['a'] | ['a', 'b'] | ['b']
 */
export type PathTuples<T> = Call<Strings.Split, '.', PathStrings<T>>

/**
 * Paths<typeof { a: { b: 1 }, b: 1 }>
 * => 'a' | 'a.b' | 'b' | ['a'] | ['a', 'b'] | ['b']
 */
export type Paths<T> = PathStrings<T> | PathTuples<T>

/**
 * StringPathValue<typeof { a: { b: 1 }, b: 1 }, 'a.b'>
 * => number
 * StringPathValue<typeof [1,'2',3], '0'>
 * => number
 * StringPathValue<typeof [1,'2',3], 0>
 * => number
 */
export type StringPathValue<T, P> = Call<Objects.Get, P, T>

/**
 * TuplePathValue<typeof { a: { b: 1 }, b: 1 }, ['a', 'b']>
 * => number
 */
export type TuplePathValue<T, P> = StringPathValue<T, JoinPath<P>>

/**
 * PathValue<typeof { a: { b: 1 }, b: 1 }, 'a.b'>
 * or
 * PathValue<typeof { a: { b: 1 }, b: 1 }, ['a', 'b']>
 * => number
 */
export type PathValue<T, P extends string | string[]> = P extends string[]
  ? TuplePathValue<T, P>
  : P extends string
  ? StringPathValue<T, P>
  : never

/**
 * ArgsType<(a: number, b: string) => void>
 * => [number, string]
 */
export type ArgsType<T> = T extends (...args: infer A) => _IntentionalAny ? A : never

/**
 * Returns function where two arguments are switched places
 *
 * @example
 * Objects.Get<Path, Obj>
 *
 * FnWithSwitchedTwoArgs<Objects.Get, Obj, Path>
 */
interface FnWithSwitchedArgs<SomeFn extends Fn, Arg1> extends Fn {
  return: Call<SomeFn, this['arg0'], Arg1>
}

type ObjectGetByPathFn<O> = FnWithSwitchedArgs<Objects.Get, O>

/**
 * Returns all paths values of which in Obj are extended of Type
 *
 * @example
 * AllPathsWhichExtend<{ a: { b: 1, c: 'str' }, b: 1 }, number> => 'b' | 'a.b'
 */
export type AllPathsWhichExtend<Obj extends object, Type> = Pipe<
  PathStrings<Obj>,
  [
    Unions.ToTuple,
    Tuples.Filter<ComposeLeft<[ObjectGetByPathFn<Obj>, Booleans.Extends<Type>]>>,
    Tuples.ToUnion
  ]
>

/**
 * Returns all keys which values in Obj are extended of Type (not deep)
 *
 * For deep use AllPathsWhichExtend
 *
 * @example
 * AllKeysWhichExtend<{ a: { a: 1, b: 'str' }, b: 1 }, number> => 'b'
 */
export type AllKeysWhichExtend<Obj, Type> = keyof {
  [K in keyof Obj as Obj[K] extends Type ? K : never]: _IntentionalAny
}

/**
 * Returns all keys which values in Obj are NOT extended of Type (not deep)
 *
 * @example
 * AllKeysWhichNotExtend<{ a: { a: 1, b: 'str' }, b: 1 }, number> => 'a'
 */
export type AllKeysWhichNotExtend<Obj, Type> = keyof {
  [K in keyof Obj as Obj[K] extends Type ? never : K]: _IntentionalAny
}

/**
 * Returns true if key is optional
 *
 * @example
 * IsOptional<{ a?: 1 }, 'a'> => true
 * IsOptional<{ a: 1 }, 'a'> => false
 */
export type IsOptional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false

/**
 * Returns true if key is required
 *
 * @example
 * IsRequired<{ a: 1 }, 'a'> => true
 * IsRequired<{ a?: 1 }, 'a'> => false
 */
export type IsRequired<T, K extends keyof T> = {} extends Pick<T, K> ? false : true

/**
 * Returns key if it is defined in Obj othervise never
 *
 * @example
 * DefinedKey<{ a: 1, b: undefined }, 'a'> => 'a'
 * DefinedKey<{ a: 1, b: undefined }, 'b'> => never
 * DefinedKey<{ a: 1, b: undefined }, 'd'> => never
 */
export type DefinedKey<Obj, Key> = Key extends keyof Obj
  ? Obj[Key] extends undefined
    ? never
    : Key
  : never

/**
 * Returns new obj with keys in Key which are defined in Obj
 *
 * @example
 * PickDefined<{ a: 1; b: 2; c: undefined }, 'a' | 'b' | 'c' | 'd'> => { a: 1; b: 2; }
 */
export type PickDefined<Obj, Key> = {
  [TK in Key as DefinedKey<Obj, TK>]: TK extends keyof Obj ? Obj[TK] : never
}

interface Duplicate extends Fn {
  return: [this['arg0'], this['arg0']]
}

/**
 * Create object from union of keys
 *
 * @example
 * ObjectFromKeys<'a' | 'b'> => { a: 'a', b: 'b' }
 */
export type ObjectFromKeys<Keys> = Pipe<
  Keys,
  [Unions.ToTuple, Tuples.Map<Duplicate>, Tuples.ToUnion, Objects.FromEntries]
>

/**
 * Create object from union of keys and applies mapper to values
 *
 * @example
 * interface UnderscoreFn extends Fn {
 *   return: `_${this['arg0']}`
 * }
 * ObjectFromKeysMapper<'a' | 'b', UnderscoreFn> => { a: '_a', b: '_b' }
 */
export type ObjectFromKeysMapper<Keys, MapperFn extends Fn> = Call<
  Objects.MapValues<MapperFn>,
  ObjectFromKeys<Keys>
>

// export interface Assign1<U, V, W> {
//   (target: object, source: U): U & object
//   (target: object, source1: U, source2: V): U & V & object
//   (target: object, source1: U, source2: V, source3: W): U & V & W & object
//   (target: object, ...sources: any[]): any
// }

// type X = Assign1<{ a: number, b: number }, { b: string, d: undefined }, { c: string }>

/**
 * Returns resulting object from array of objects after Object.assign
 *
 * @example
 * Assign<[{ a: number, b: number }, { b: string, d: undefined }, { c: string }]>
 * => { a: number, b: string, d: undefined, c: string }
 */
export type Assign<T> = Pipe<
  T,
  [
    Tuples.Map<Objects.Entries>,
    Tuples.FlatMap<Unions.ToTuple>,
    Tuples.GroupBy<Tuples.At<0>>,
    Objects.MapValues<Tuples.Last>,
    Objects.MapValues<Tuples.Last>
  ]
>

// type Assign1<T extends {}, U> = (target: T, source: U)=> T & U;
// type Assign1<T extends {}, U, V> = (target: T, source1: U, source2: V)=> T & U & V;
// type Assign1<T extends {}, U, V, W> = (target: T, source1: U, source2: V, source3: W)=> T & U & V & W;
// type Assign1 = (target: object, ...sources: any[])=> any;

/**
 * Same as Assign but omits undefined
 *
 * @example
 * AssignDefined<[{ a: number, b: number }, { b: string, d: undefined }, { c: string }]>
 * => { a: number, b: string, c: string }
 */
export type AssignDefined<T> = Call<Objects.PickBy<Booleans.DoesNotExtend<undefined>>, Assign<T>>
// export type AssignDefined<T extends object[]> = typeof Object.assign<...T>

// Object.assign

export type PickAllDefined<Obj> = {
  [TK in keyof Obj as DefinedKey<Obj, TK>]: Obj[TK]
}

/**
 * Converts union to intersection
 *
 * @example
 * UnionToIntersection<{ a: 'a' } | { b: 'b' } | { c: 'c' }> => { a: 'a' } & { b: 'b' } & { c: 'c' }
 */
export type UnionToIntersection<U> = (U extends _IntentionalAny ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never

/**
 * Very specific mapping: updates all objects deeply excluding built-ins.
 * So only objects will be mapped with F.
 *
 * @example
 * /// First create a mapper function:
 * interface SetExposedFn<E extends boolean> extends Fn {
 *   return: SetExposed<this['arg0'], E>
 * }
 *
 * /// Then use it to map object:
 * type X = MapObjectsDeep<{
 *  a: number,
 *  b: { c: string }
 * }, SetExposedFn<true>>
 * /// =>
 * SetExposed<{
 *  a: number,
 *  b: SetExposed<{ c: string }, true>
 * }, true>
 */
export type MapObjectsDeep<T, F extends Fn> = T extends Builtin
  ? T
  : T extends (infer U)[]
  ? MapObjectsDeep<U, F>[]
  : T extends object
  ? Call<
      F,
      {
        [K in keyof T]: MapObjectsDeep<T[K], F>
      }
    >
  : T
