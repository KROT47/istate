import { VoidCallback } from '../types/index.js'

export function runCallbackQueue(queue: VoidCallback[]) {
  let cb: VoidCallback | undefined
  while ((cb = queue.shift())) cb()
}
