import type { EstablecimientoInfo, Estado, SurveyFile } from '../types'

/** Una fila de la lista de seguimiento. */
export interface FilaSeguimiento extends EstablecimientoInfo {
	estado: Estado
	completados: number
	total: number
	/** Bloque donde quedó (null si terminó o no inició). */
	actual: string | null
	encargado: string | null
	actualizadoEn: string | null
}

export interface DetalleEstablecimiento {
	establecimiento: EstablecimientoInfo
	/** null = aún no inicia. */
	survey: SurveyFile | null
}

export const ESTADO_TEXTO: Record<Estado, string> = {
	pendiente: 'Sin iniciar',
	en_curso: 'En curso',
	completada: 'Completada',
}
