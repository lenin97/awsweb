export type FormValue = string | number | boolean | File | null

export const isFormValue = (value: unknown): value is FormValue => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof File ||
    value === null
  )
}