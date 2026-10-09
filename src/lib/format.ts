import type { Field, Scalar } from '../types'

/** Convierte una respuesta en texto legible (Sí/No, unidades, miles). */
export function formatValue(f: Field, v: Scalar | undefined): string {
	if (v === null || v === undefined || v === '') return '—'
	if (f.type === 'toggle') return v === 1 ? (f.yesLabel ?? 'Sí') : (f.noLabel ?? 'No')
	if (typeof v === 'number') return `${v.toLocaleString('es-PE')}${f.unit ? ` ${f.unit}` : ''}`
	return v
}
