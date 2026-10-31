import { forEachState, stateFactory } from '@metamorph/istate'
import { z } from 'zod'

const userStateSchema = z.object({
  userId: z.string().optional(),
  userInfo: z
    .object({
      phone: z.string().default(''),
      name: z.string().nullable().default(null),
    })
    .default({}),
  settings: z
    .object({
      promoAgreed: z.boolean().default(true),
    })
    .default({}),
})

export const userState = stateFactory({
  id: 'user',
  loggerCategory: 'app',
  schema: userStateSchema,
  localStorageSync: true,
  getters: ['isLoggedIn'],
  eventMap: {} as {
    login: (payload: { userId: string; isSignUp: boolean }) => void
    logout: (message?: string) => void
  },
  setPrototype: (baseProto) => ({
    ...baseProto,

    get isLoggedIn() {
      return !!this.userId
    },

    login({ userId, isSignUp = false }: { userId: string; isSignUp?: boolean }) {
      this.userId = userId
      forEachState((state) => state.update())
      this.emit('login', { userId, isSignUp })
    },

    logout(message?: string) {
      if (!this.isLoggedIn) return
      forEachState((state) => state.reset())
      this.emit('logout', message)
    },
  }),
})
