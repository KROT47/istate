import { allStates } from './allStates.js'
import { AnyState } from './stateFactory/types.js'

export function forEachState(cb: (state: AnyState) => void) {
  allStates.forEach((state) => cb(state))
}
