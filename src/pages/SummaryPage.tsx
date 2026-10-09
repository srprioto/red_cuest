import { Pencil } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useSurvey } from '../context/SurveyContext'
import { formatValue } from '../lib/format'
import { resumeTarget } from '../lib/navigation'
import { isVisible, validateBlock } from '../lib/validation'
import { BLOCKS, PHASES, PHASE_ORDER } from '../survey'
import { TOTALES_POR_FASE } from '../survey/totales'
import type { Answers, Block, Field, Item } from '../types'

function AnswerList({ fields, values }: { fields: Field[]; values: Item }) {
	return (
		<dl className="answers">
			{fields
				.filter((f) => isVisible(f, values))
				.map((f) => (
					<div key={f.id} className="answers__row">
						<dt>{f.section ? `${f.section}: ${f.label}` : f.label}</dt>
						<dd>{formatValue(f, values[f.id])}</dd>
					</div>
				))}
		</dl>
	)
}

function BlockSummary({ block }: { block: Block }) {
	const { answers } = useSurvey()
	const answer = answers[block.id]
	if (!answer) return null
	const repeat = block.repeat

	return (
		<section className="summary__block">
			<header>
				<h3>{block.title}</h3>
				<Link to={`/encuesta/${block.id}`} className="icon-btn">
					<Pencil size={16} />
					<span>Editar</span>
				</Link>
			</header>
			{block.fields.length > 0 && <AnswerList fields={block.fields} values={answer.values} />}
			{repeat && (
				<>
					<AnswerList fields={[repeat.gate]} values={answer.values} />
					{(answer.items ?? []).map((item, i) => (
						<div key={i} className="summary__item">
							<h4>
								{repeat.itemTitle} {i + 1}
							</h4>
							<AnswerList fields={repeat.fields} values={item} />
						</div>
					))}
				</>
			)}
		</section>
	)
}

/** Tabla Actual | Faltante por área, para ver la brecha de un vistazo. */
function Comparison({ answers }: { answers: Answers }) {
	const groups = BLOCKS.filter((b) => b.phase === 'faltante' && b.id.startsWith('faltante_'))
		.map((fb) => {
			const ab = BLOCKS.find((b) => b.id === fb.id.replace('faltante_', ''))
			const rows = fb.fields
				.filter((f) => f.type === 'number')
				.map((f) => ({ f, actualField: ab?.fields.find((x) => x.id === f.id && x.type === 'number') }))
				.filter((r) => r.actualField)
				.map(({ f, actualField }) => ({
					id: f.id,
					label: f.label.replace(/ (que )?faltantes?$/i, ''),
					actual: formatValue(actualField!, answers[ab!.id]?.values[f.id]),
					faltante: formatValue(f, answers[fb.id]?.values[f.id]),
				}))
			return { id: fb.id, title: fb.title, rows }
		})
		.filter((g) => g.rows.length > 0)

	return (
		<section className="summary__part" aria-label="Comparación por área">
			<h2 className="part-title">Comparación por área</h2>
			<div className="compare">
				<table>
					<thead>
						<tr>
							<th>Concepto</th>
							<th className="compare__num compare__num--actual">Actual</th>
							<th className="compare__num compare__num--faltante">Faltante</th>
						</tr>
					</thead>
					<tbody>
						{groups.map((g) => (
							<GroupRows key={g.id} title={g.title} rows={g.rows} />
						))}
					</tbody>
				</table>
			</div>
		</section>
	)
}

function GroupRows({
	title,
	rows,
}: {
	title: string
	rows: { id: string; label: string; actual: string; faltante: string }[]
}) {
	return (
		<>
			<tr className="compare__area">
				<td colSpan={3}>{title}</td>
			</tr>
			{rows.map((r) => (
				<tr key={r.id}>
					<td>{r.label}</td>
					<td className="compare__num compare__num--actual">{r.actual}</td>
					<td className="compare__num compare__num--faltante">{r.faltante}</td>
				</tr>
			))}
		</>
	)
}

export default function SummaryPage() {
	const { session, metadata, answers } = useSurvey()
	if (!session) return <Navigate to="/ingreso" replace />
	if (!metadata.finished) return <Navigate to={resumeTarget(metadata)} replace />

	const invalid = BLOCKS.filter(
		(b) => answers[b.id] && Object.keys(validateBlock(b, answers[b.id], answers)).length > 0,
	)

	return (
		<div className="summary">
			<header className="block__header">
				<p className="block__eyebrow">
					IPRESS {session.ipress} · {session.encargado}
				</p>
				<h1>Encuesta completada</h1>
				<p>Gracias por tu tiempo. Estas son tus respuestas y los totales calculados a partir de ellas.</p>
			</header>

			{invalid.length > 0 && (
				<div className="block__alert" role="alert">
					Algunas respuestas ya no son consistentes entre sí. Revisa:{' '}
					{invalid.map((b, i) => (
						<span key={b.id}>
							{i > 0 && ', '}
							<Link to={`/encuesta/${b.id}`}>{b.title}</Link>
						</span>
					))}
					.
				</div>
			)}

			<Comparison answers={answers} />

			{PHASE_ORDER.map((phase) => (
				<section key={phase} className="summary__part" data-phase={phase}>
					<h2 className="part-title">{PHASES[phase].title}</h2>
					<div className="totals" aria-label={`Totales: ${PHASES[phase].title}`}>
						{TOTALES_POR_FASE[phase](answers).map((t) => (
							<div key={t.id} className="totals__item">
								<span className="totals__value">{t.value.toLocaleString('es-PE')}</span>
								<span className="totals__label">{t.label}</span>
							</div>
						))}
					</div>
					{BLOCKS.filter((b) => b.phase === phase).map((b) => (
						<BlockSummary key={b.id} block={b} />
					))}
				</section>
			))}
		</div>
	)
}
