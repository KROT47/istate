import { memoizeWithArgs } from 'proxy-memoize'

import { AnyState } from '../../types.js'

export const twoStatesMemoizedGetterFactory =
  <State1 extends AnyState, State2 extends AnyState>() =>
  <R, Fn extends (snap1: ReturnType<State1['getSnap']>, snap2: ReturnType<State2['getSnap']>) => R>(
    fn: Fn
  ): Fn => {
    // when setting size to some amount we get much better performance
    const memoizedFn = memoizeWithArgs(fn, { size: 20 })
    const memoizedGetter = (state1, state2) => {
      return memoizedFn(state1.getSnap(), state2.getSnap())
    }
    // @ts-ignore
    return memoizedGetter
  }
