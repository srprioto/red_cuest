import type { FilaSeguimiento } from '../src/admin/types'
import { describeProgress, type ProgressInfo } from '../src/survey/progreso'
import type { SurveyFile } from '../src/types'
import { readEstablecimientos, readSurvey, type Establecimiento } from './storage.js'

/** Un establecimiento unido a su encuesta (si existe) y a su avance real. */
export interface Fila {
	est: Establecimiento
	survey: SurveyFile | null
	progreso: ProgressInfo
}

export const buildFila = (est: Establecimiento, survey: SurveyFile | null): Fila => ({
	est,
	survey,
	progreso: describeProgress(survey?.metadata, !!survey),
})

/** Cruza la lista maestra con las encuestas. `codigos` limita a esos establecimientos. */
export async function cargarFilas(codigos?: string[]): Promise<Fila[]> {
	const wanted = codigos ? new Set(codigos) : null
	const ests = (await readEstablecimientos()).filter((e) => !wanted || wanted.has(e.codigo))
	return Promise.all(ests.map(async (est) => buildFila(est, await readSurvey(est.codigo))))
}

export const toFilaSeguimiento = ({ est, survey, progreso }: Fila): FilaSeguimiento => ({
	...est,
	estado: progreso.estado,
	completados: progreso.completados,
	total: progreso.total,
	actual: progreso.actual,
	encargado: survey?.encargado ?? null,
	actualizadoEn: survey?.actualizadoEn ?? null,
})
