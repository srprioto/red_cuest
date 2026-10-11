import type { Answers, Field, Scalar } from '../types'
import { BLOCKS } from './index'

interface ComparisonRow {
	id: string
	label: string
	unit?: string
	actual: Scalar | undefined
	faltante: Scalar | undefined
	actualField: Field
	faltanteField: Field
}

interface ComparisonGroup {
	id: string
	title: string
	rows: ComparisonRow[]
}

/** Compara, por área, lo que hay (Parte 1) con lo que falta (Parte 2). */
export function buildComparison(answers: Answers): ComparisonGroup[] {
	return BLOCKS.filter((b) => b.phase === 'faltante' && b.id.startsWith('faltante_'))
		.map((fb) => {
			const ab = BLOCKS.find((b) => b.id === fb.id.replace('faltante_', ''))
			const rows: ComparisonRow[] = []
			for (const f of fb.fields) {
				const af = ab?.fields.find((x) => x.id === f.id && x.type === 'number')
				if (f.type !== 'number' || !ab || !af) continue
				rows.push({
					id: f.id,
					label: f.label.replace(/ (que )?falta(n|ntes?)$/i, ''),
					unit: f.unit,
					actual: answers[ab.id]?.values[f.id],
					faltante: answers[fb.id]?.values[f.id],
					actualField: af,
					faltanteField: f,
				})
			}
			return { id: fb.id, title: fb.title, rows }
		})
		.filter((g) => g.rows.length > 0)
}
