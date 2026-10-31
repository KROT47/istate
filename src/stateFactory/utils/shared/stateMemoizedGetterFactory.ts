import { memoize } from 'proxy-memoize'

import { AnyState } from '../../types.js'

export const stateMemoizedGetterFactory =
  <State extends AnyState>() =>
  <R, Fn extends (snap: ReturnType<State['getSnap']>) => R>(fn: Fn): Fn => {
    const memoizedFn = memoize(fn)
    const memoizedGetter = (state) => memoizedFn(state.getSnap())
    // @ts-ignore
    return memoizedGetter
  }
