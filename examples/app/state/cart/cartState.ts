import { stateFactory } from '@metamorph/istate'
import { z } from 'zod'

const cartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  qty: z.number(),
})

const cartStateSchema = z.object({
  items: z.array(cartItemSchema).default([]),
})

export const cartState = stateFactory({
  id: 'cart',
  loggerCategory: 'app',
  schema: cartStateSchema,
  getters: ['total'],
  setPrototype: (baseProto) => ({
    ...baseProto,

    get total() {
      return this.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    },

    addItem(item: z.infer<typeof cartItemSchema>) {
      const existing = this.items.find((entry) => entry.id === item.id)
      if (existing) existing.qty += item.qty
      else this.items.push(item)
    },
  }),
})
