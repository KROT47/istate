export function getValidDate(maybeDate: unknown): Date | undefined {
  const date = new Date(maybeDate as any)
  // @ts-ignore
  const isInvalidDate = isNaN(date)
  return isInvalidDate ? undefined : date
}
