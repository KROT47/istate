export type InitTask = () => void | Promise<void>

export type InitScheduler = (task: InitTask) => void

export const defaultInitScheduler: InitScheduler = (task) => {
  queueMicrotask(() => {
    void task()
  })
}

let scheduler: InitScheduler = defaultInitScheduler

export function setInitScheduler(next: InitScheduler) {
  scheduler = next
}

export function scheduleStateInit(task: InitTask) {
  scheduler(task)
}
