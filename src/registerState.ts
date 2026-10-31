import { allStates } from './allStates.js'
import { AnyState } from './stateFactory/types.js'

export function registerState(state: AnyState) {
  allStates.push(state)
}
