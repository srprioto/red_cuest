import { BLOCKS } from '../survey'
import type { Metadata } from '../types'

/** Ruta a la que debe ir alguien que entra o continúa la encuesta. */
export function resumeTarget(metadata: Metadata): string {
	if (metadata.finished) return '/resumen'
	// Quien aún no responde ningún bloque ve primero los datos de su establecimiento
	if (metadata.completedBlocks.length === 0) return '/establecimiento'
	const block = BLOCKS[Math.min(metadata.currentBlock, BLOCKS.length - 1)]
	return `/encuesta/${block.id}`
}
