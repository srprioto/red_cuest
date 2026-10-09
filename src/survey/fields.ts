import type { Field, Item } from '../types'

/** Constructores cortos para escribir las preguntas. */
export const cantidad = (id: string, label: string, extra: Partial<Field> = {}): Field => ({
	id,
	label,
	type: 'number',
	...extra,
})

export const siNo = (id: string, label: string, extra: Partial<Field> = {}): Field => ({
	id,
	label,
	type: 'toggle',
	...extra,
})

export const TIPO_CONTRATO = ['Convenio', 'Contrato con EESS', 'Internet social', 'Otros']
export const TIPO_INTERNET = ['Internet empresarial', 'Internet hogar']
export const OPERADORES = ['Claro', 'Movistar', 'Bitel', 'Entel', 'Otros']
export const TENENCIA = ['Propio', 'Alquilado', 'Prestado', 'Donado']
export const ESTADOS = ['Operativo en uso', 'Operativo sin uso', 'No operativo']

/** Las preguntas de internet solo aplican si el ancho de banda es mayor a 0. */
export const hayInternet = (v: Item) => typeof v.ancho_banda === 'number' && v.ancho_banda > 0
