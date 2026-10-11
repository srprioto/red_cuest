import { formatValue } from '../lib/format'
import type { Answers, Block, FieldRef, Phase } from '../types'
import { ACTUAL_BLOCKS } from './parte1'
import { FALTANTE_BLOCKS } from './parte2'

interface PhaseInfo {
	label: string
	title: string
	intro: string
}

export const PHASES: Record<Phase, PhaseInfo> = {
	actual: {
		label: 'Parte 1',
		title: 'Cantidad actual de equipos informáticos por áreas',
		intro: 'Indica con qué cuenta hoy el establecimiento.',
	},
	faltante: {
		label: 'Parte 2',
		title: 'Cantidad faltante de equipos informáticos por áreas',
		intro:
			'Ahora indica qué le falta al establecimiento para cubrir sus necesidades. En cada pregunta verás, como referencia, lo que declaraste en la parte anterior.',
	},
}

export const PHASE_ORDER: Phase[] = ['actual', 'faltante']

/** Orden real de la encuesta: primero toda la Parte 1 y luego la Parte 2. */
export const BLOCKS: Block[] = [...ACTUAL_BLOCKS, ...FALTANTE_BLOCKS]
export const TOTAL_BLOCKS = BLOCKS.length

export const isPhase = (v: string | undefined): v is Phase => v === 'actual' || v === 'faltante'

export const firstBlockIndex = (phase: Phase) => BLOCKS.findIndex((b) => b.phase === phase)

/** Texto de la respuesta a la que apunta `ref`, o null si aún no existe. */
export function getReference(ref: FieldRef, answers: Answers): string | null {
	const field = BLOCKS.find((b) => b.id === ref.block)?.fields.find((f) => f.id === ref.field)
	const value = answers[ref.block]?.values[ref.field]
	if (!field || value === null || value === undefined) return null
	return formatValue(field, value)
}
