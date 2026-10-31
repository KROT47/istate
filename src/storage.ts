export type StateStorage = {
  getJson<T>(key: string): T | null
  setJson(key: string, value: unknown): void
  clear(): void
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>

export function createMemoryStorage(): StateStorage {
  const data = new Map<string, string>()
  return {
    getJson(key) {
      const raw = data.get(key)
      if (raw === undefined) return null
      try {
        return JSON.parse(raw) as never
      } catch {
        return null
      }
    },
    setJson(key, value) {
      data.set(key, JSON.stringify(value))
    },
    clear() {
      data.clear()
    },
  }
}

export function createLocalStorage(backing: StorageLike): StateStorage {
  return {
    getJson(key) {
      try {
        const raw = backing.getItem(key)
        if (!raw) return null
        return JSON.parse(raw) as never
      } catch (error) {
        console.error('Failed to load item from storage', error)
        return null
      }
    },
    setJson(key, value) {
      try {
        backing.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error('Failed to save item to storage', error)
      }
    },
    clear() {
      backing.clear()
    },
  }
}

let current: StateStorage | undefined

function defaultStorage(): StateStorage {
  const localStorage = globalThis.localStorage
  if (localStorage) return createLocalStorage(localStorage)
  return createMemoryStorage()
}

export function getStateStorage(): StateStorage {
  if (!current) current = defaultStorage()
  return current
}

export function setStateStorage(next: StateStorage) {
  current = next
}

export const storage: StateStorage = {
  getJson(key) {
    return getStateStorage().getJson(key)
  },
  setJson(key, value) {
    getStateStorage().setJson(key, value)
  },
  clear() {
    getStateStorage().clear()
  },
}
