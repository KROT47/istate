import { useEffect } from 'react'

import { fetchWarehouse, syncAddresses } from '../../api/client.js'
import { addressState } from './addressState.js'

export function useInitAddressState() {
  useEffect(() => {
    return addressState.on('fetchWarehouse', (coordinates, cb) => {
      void fetchWarehouse(coordinates).then((warehouse) => cb(warehouse))
    })
  }, [])

  useEffect(() => {
    return addressState.addSync({
      path: '_knownAddresses',
      uniqueKeyGetter: (address) => address.id,
      errorHandler(error) {
        console.error(error)
      },
      sync: (addresses) => syncAddresses(addresses),
    })
  }, [])
}
