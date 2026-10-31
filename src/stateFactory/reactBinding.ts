type UseSnapshotFn = (state: object) => object

let useSnapshotImpl: UseSnapshotFn | undefined

export function registerUseSnapshot(fn: UseSnapshotFn) {
  useSnapshotImpl = fn
}

export function callUseSnapshot(state: object): object {
  if (!useSnapshotImpl) {
    throw new Error(
      'useSnap() needs @metamorph/istate/react. Import it before calling useSnap().',
    )
  }
  return useSnapshotImpl(state)
}
