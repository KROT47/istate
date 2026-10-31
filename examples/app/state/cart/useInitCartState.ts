import { useEffect } from 'react'

import { syncCart } from '../../api/client.js'
import { cartState } from './cartState.js'

export function useInitCartState() {
  useEffect(() => {
    return cartState.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler(error) {
        console.error(error)
      },
      sync: (items) => syncCart(items),
    })
  }, [])
}
