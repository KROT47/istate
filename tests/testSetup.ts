import { beforeEach } from 'vitest'

import { allStates } from '../src/allStates.js'
import { setInitScheduler } from '../src/initScheduler.js'
import { setStateLoggerFactory, type StateLoggerFactory } from '../src/logger.js'
import { createMemoryStorage, setStateStorage } from '../src/storage.js'

export type LogRecord = {
  level: 'error' | 'critical'
  category: string[]
  args: unknown[]
}

export const logs: LogRecord[] = []

export function logMessages(level?: LogRecord['level']) {
  return logs.filter((entry) => !level || entry.level === level).map((entry) => String(entry.args[0]))
}

const recordingLogger: StateLoggerFactory = (category) => ({
  error(message, ...args) {
    logs.push({ level: 'error', category, args: [message, ...args] })
  },
  critical(message, ...args) {
    logs.push({ level: 'critical', category, args: [message, ...args] })
  },
})

beforeEach(() => {
  logs.length = 0
  allStates.length = 0
  setStateStorage(createMemoryStorage())
  setStateLoggerFactory(recordingLogger)
  setInitScheduler((task) => {
    void task()
  })
})
