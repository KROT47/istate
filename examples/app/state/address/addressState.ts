import { stateFactory } from '@metamorph/istate'
import { z } from 'zod'

const addressSchema = z.object({
  id: z.string(),
  street: z.string(),
  lat: z.number(),
  lng: z.number(),
})

const addressStateSchema = z.object({
  currentWarehouse: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullish(),
  _addressKey: z.string().optional(),
  _knownAddresses: z.array(addressSchema).default([]),
})

export const addressState = stateFactory({
  id: 'address',
  loggerCategory: 'app',
  schema: addressStateSchema,
  localStorageSync: true,
  getters: ['knownAddresses', 'coordinates'],
  eventMap: {} as {
    fetchWarehouse: (
      coordinates: { lat: number; lng: number },
      cb: (warehouse: { id: string; name: string } | undefined) => void,
    ) => void
  },
  setPrototype: (baseProto) => ({
    ...baseProto,

    init() {
      const fetchCurrentWarehouse = () => {
        const { coordinates } = this
        if (!coordinates) return
        this.emit('fetchWarehouse', coordinates, (warehouse) => {
          this.currentWarehouse = warehouse
        })
      }

      fetchCurrentWarehouse()
      this.subscribePath('_addressKey', fetchCurrentWarehouse)
    },

    get knownAddresses() {
      return this._knownAddresses
    },

    get coordinates() {
      const address = this._knownAddresses.find((item) => item.id === this._addressKey)
      if (!address) return undefined
      return { lat: address.lat, lng: address.lng }
    },

    selectAddress(id: string) {
      this._addressKey = id
    },

    addAddress(address: z.infer<typeof addressSchema>) {
      this._knownAddresses.push(address)
      this._addressKey = address.id
    },
  }),
})
