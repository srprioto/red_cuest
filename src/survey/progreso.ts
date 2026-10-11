import type { Estado, Metadata, Phase } from '../types'
import { BLOCKS } from './index'

/** Índice del primer bloque sin responder (BLOCKS.length si ya se respondieron todos). */
export function firstIncompleteIndex(completed: readonly string[]): number {
	const i = BLOCKS.findIndex((b) => !completed.includes(b.id))
	return i === -1 ? BLOCKS.length : i
}

interface BlockStatus {
	id: string
	title: string
	phase: Phase
	done: boolean
}

export interface ProgressInfo {
	estado: Estado
	/** Avance REAL (no la curva engañosa de la línea inferior). */
	completados: number
	total: number
	finished: boolean
	/** Título del bloque donde quedó, o null si ya terminó o no ha iniciado. */
	actual: string | null
	bloques: BlockStatus[]
}

/**
 * Avance real de una encuesta. Se calcula siempre contra la lista actual de
 * bloques, así que sigue siendo correcto si se agregan preguntas después.
 */
export function describeProgress(
	metadata: Partial<Metadata> | null | undefined,
	hasSurvey: boolean,
): ProgressInfo {
	const completed = metadata?.completedBlocks ?? []
	const bloques = BLOCKS.map((b) => ({
		id: b.id,
		title: b.title,
		phase: b.phase,
		done: completed.includes(b.id),
	}))
	const completados = bloques.filter((b) => b.done).length
	const finished = completados === BLOCKS.length
	const estado: Estado = !hasSurvey ? 'pendiente' : finished ? 'completada' : 'en_curso'
	const actual = hasSurvey && !finished ? (bloques.find((b) => !b.done)?.title ?? null) : null
	return { estado, completados, total: BLOCKS.length, finished, actual, bloques }
}
