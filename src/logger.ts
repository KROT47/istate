export type StateLogger = {
  error: (message: string, ...args: unknown[]) => void
  critical: (message: string, ...args: unknown[]) => void
}

export type StateLoggerFactory = (category: string[]) => StateLogger

export function createConsoleStateLogger(category: string[]): StateLogger {
  const prefix = category.join(':')
  return {
    error(message, ...args) {
      console.error(prefix, message, ...args)
    },
    critical(message, ...args) {
      console.error(prefix, message, ...args)
    },
  }
}

let factory: StateLoggerFactory = createConsoleStateLogger

export function setStateLoggerFactory(next: StateLoggerFactory) {
  factory = next
}

export function getStateLogger(category: string[]): StateLogger {
  return factory(category)
}
