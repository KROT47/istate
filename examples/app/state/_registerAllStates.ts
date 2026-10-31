import { registerState } from '@metamorph/istate'

import { addressState } from './address/index.js'
import { cartState } from './cart/index.js'
import { userState } from './user/index.js'

export function _registerAllStates() {
  ;[addressState, cartState, userState].forEach(registerState)
}
