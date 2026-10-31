'use client'

import { useInitAddressState } from './address/index.js'
import { useInitCartState } from './cart/index.js'
import { useInitUserState } from './user/index.js'

export function _useInitState() {
  useInitAddressState()
  useInitCartState()
  useInitUserState()
}
