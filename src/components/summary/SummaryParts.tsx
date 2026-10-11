import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatValue } from '../../lib/format'
import { isVisible } from '../../lib/validation'
import { BLOCKS, PHASES, PHASE_ORDER } from '../../survey'
import { buildComparison } from '../../survey/comparacion'
import { TOTALES_POR_FASE } from '../../survey/totales'
import type { Answers, Block, Field, Item } from '../../types'

/** Piezas del resumen. Las usan la pantalla final del encuestado y el detalle del panel. */

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

function BlockSummary({
	block,
	answers,
	editable,
}: {
	block: Block
	answers: Answers
	editable: boolean
}) {
	const answer = answers[block.id]
	if (!answer) return null
	const repeat = block.repeat

	return (
		<section className="summary__block">
			<header>
				<h3>{block.title}</h3>
				{editable && (
					<Link to={`/encuesta/${block.id}`} className="icon-btn">
						<Pencil size={16} />
						<span>Editar</span>
					</Link>
				)}
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
export function Comparison({ answers }: { answers: Answers }) {
	const groups = buildComparison(answers)

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
							<GroupRows key={g.id} group={g} />
						))}
					</tbody>
				</table>
			</div>
		</section>
	)
}

function GroupRows({ group }: { group: ReturnType<typeof buildComparison>[number] }) {
	return (
		<>
			<tr className="compare__area">
				<td colSpan={3}>{group.title}</td>
			</tr>
			{group.rows.map((r) => (
				<tr key={r.id}>
					<td>{r.label}</td>
					<td className="compare__num compare__num--actual">{formatValue(r.actualField, r.actual)}</td>
					<td className="compare__num compare__num--faltante">
						{formatValue(r.faltanteField, r.faltante)}
					</td>
				</tr>
			))}
		</>
	)
}

interface PhaseSectionsProps {
	answers: Answers
	/** Muestra el botón "Editar" de cada bloque (solo para quien responde). */
	editable: boolean
	/** Muestra los totales calculados (solo tienen sentido con la encuesta completa). */
	totals: boolean
}

/** Una sección por parte: totales y respuestas de cada bloque. */
export function PhaseSections({ answers, editable, totals }: PhaseSectionsProps) {
	return (
		<>
			{PHASE_ORDER.map((phase) => (
				<section key={phase} className="summary__part" data-phase={phase}>
					<h2 className="part-title">{PHASES[phase].title}</h2>
					{totals && (
						<div className="totals" aria-label={`Totales: ${PHASES[phase].title}`}>
							{TOTALES_POR_FASE[phase](answers).map((t) => (
								<div key={t.id} className="totals__item">
									<span className="totals__value">{t.value.toLocaleString('es-PE')}</span>
									<span className="totals__label">{t.label}</span>
								</div>
							))}
						</div>
					)}
					{BLOCKS.filter((b) => b.phase === phase).map((b) => (
						<BlockSummary key={b.id} block={b} answers={answers} editable={editable} />
					))}
				</section>
			))}
		</>
	)
}
