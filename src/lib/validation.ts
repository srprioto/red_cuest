import { NA_VALUE } from '../config'
import type { Answers, Block, BlockAnswer, Errors, Field, Item, Scalar } from '../types'
import { itemKey } from './utils'

const OCTET = '(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)'
const IPV4 = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`)

export const isValidIPv4 = (s: string) => IPV4.test(s.trim())

export function isValidMask(raw: string): boolean {
	const s = raw.trim()
	if (/^\/([0-9]|[12]\d|3[0-2])$/.test(s)) return true
	if (!isValidIPv4(s)) return false
	const n = s.split('.').reduce((acc, p) => ((acc << 8) | Number(p)) >>> 0, 0)
	const inv = ~n >>> 0
	return (inv & (inv + 1)) === 0 // 1s contiguos seguidos de 0s
}

const isEmpty = (v: Scalar | undefined) =>
	v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

export const isVisible = (f: Field, values: Item) => !f.showIf || f.showIf(values)

export function validateField(f: Field, value: Scalar | undefined, values: Item): string | null {
	if (f.type === 'toggle') {
		return value === 0 || value === 1 ? null : 'Selecciona una opción.'
	}
	if (isEmpty(value)) {
		return f.type === 'select' ? 'Selecciona una opción.' : 'Este campo es obligatorio.'
	}
	if (f.allowNA && value === NA_VALUE) return null

	switch (f.type) {
		case 'number': {
			if (typeof value !== 'number' || Number.isNaN(value)) return 'Ingresa un número válido.'
			if (!f.decimal && !Number.isInteger(value)) return 'Ingresa un número entero.'
			const min = f.min ?? 0
			if (value < min) return `Debe ser mayor o igual a ${min}.`
			if (f.max !== undefined && value > f.max) return `Debe ser menor o igual a ${f.max}.`
			if (f.lteField) {
				const other = values[f.lteField]
				if (typeof other === 'number' && value > other) {
					return 'No puede ser mayor que la capacidad total.'
				}
			}
			return null
		}
		case 'select':
			return f.options?.includes(String(value)) ? null : 'Selecciona una opción.'
		case 'ip':
			return isValidIPv4(String(value)) ? null : 'Ingresa una IP válida. Ejemplo: 192.168.1.0'
		case 'mask':
			return isValidMask(String(value))
				? null
				: 'Ingresa una máscara válida. Ejemplo: 255.255.255.0 o /24'
		default:
			return null
	}
}

function validateList(fields: Field[], values: Item, keyOf: (id: string) => string): Errors {
	const errors: Errors = {}
	for (const f of fields) {
		if (!isVisible(f, values)) continue
		const err = validateField(f, values[f.id], values)
		if (err) errors[keyOf(f.id)] = err
	}
	return errors
}

export function validateBlock(block: Block, answer: BlockAnswer, all: Answers): Errors {
	const errors: Errors = validateList(block.fields, answer.values, (id) => id)

	if (block.repeat) {
		const { gate, fields } = block.repeat
		const gateError = validateField(gate, answer.values[gate.id], answer.values)
		if (gateError) {
			errors[gate.id] = gateError
		} else if (answer.values[gate.id] === 1) {
			const items = answer.items ?? []
			if (items.length === 0) errors._items = 'Agrega al menos un registro.'
			items.forEach((item, i) =>
				Object.assign(errors, validateList(fields, item, (id) => itemKey(i, id))),
			)
		}
	}

	if (block.crossValidate) {
		const cross = block.crossValidate(answer.values, all)
		for (const [k, v] of Object.entries(cross)) if (!(k in errors)) errors[k] = v
	}
	return errors
}

/** Quita valores de campos ocultos y registros de grupos deshabilitados. */
export function cleanAnswer(block: Block, answer: BlockAnswer): BlockAnswer {
	const strip = (fields: Field[], values: Item): Item => {
		const out: Item = {}
		for (const f of fields) if (isVisible(f, values)) out[f.id] = values[f.id] ?? null
		return out
	}
	const values = strip(
		[...block.fields, ...(block.repeat ? [block.repeat.gate] : [])],
		answer.values,
	)
	if (!block.repeat) return { values }
	const items =
		values[block.repeat.gate.id] === 1
			? (answer.items ?? []).map((it) => strip(block.repeat!.fields, it))
			: []
	return { values, items }
}
