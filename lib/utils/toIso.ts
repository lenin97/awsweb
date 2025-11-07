export function toIso(date:string) {
  if (!date) return undefined
  return new Date(date).toISOString()
}