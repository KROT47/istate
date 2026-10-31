export type UserProfile = {
  phone: string
  name: string | null
}

export type UserSettings = {
  promoAgreed: boolean
}

export type Address = {
  id: string
  street: string
  lat: number
  lng: number
}

export type Warehouse = {
  id: string
  name: string
}

export type CartItem = {
  id: string
  title: string
  price: number
  qty: number
}

export async function fetchUserProfile(): Promise<UserProfile> {
  return { phone: '79000000000', name: 'Ada' }
}

export async function syncUserSettings(settings: UserSettings | undefined) {
  if (!settings) return settings
  return { promoAgreed: settings.promoAgreed }
}

export async function trackSession(session: { userId: string; isSignUp: boolean }) {
  return session
}

export async function fetchWarehouse(coordinates: { lat: number; lng: number }): Promise<Warehouse> {
  return { id: 'warehouse-1', name: `${coordinates.lat},${coordinates.lng}` }
}

export async function syncAddresses(addresses: Address[] | undefined) {
  return addresses ?? []
}

export async function syncCart(items: CartItem[] | undefined) {
  return items ?? []
}
