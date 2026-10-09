import type { Item, Scalar } from '../types'

export const num = (v: Scalar | undefined): number =>
  typeof v === 'number' && !Number.isNaN(v) ? v : 0

export const itemKey = (index: number, fieldId: string) => `item:${index}:${fieldId}`

export const emptyItem = (ids: string[]): Item =>
  Object.fromEntries(ids.map((id) => [id, null]))
