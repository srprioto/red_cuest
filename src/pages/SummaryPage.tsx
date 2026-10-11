import { Link, Navigate } from 'react-router-dom'
import { Comparison, PhaseSections } from '../components/summary/SummaryParts'
import { useSurvey } from '../context/SurveyContext'
import { resumeTarget } from '../lib/navigation'
import { validateBlock } from '../lib/validation'
import { BLOCKS } from '../survey'

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
					IPRESS {session.ipress}
					{session.establecimiento ? ` · ${session.establecimiento}` : ''} · {session.encargado}
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
			<PhaseSections answers={answers} editable totals />
		</div>
	)
}
