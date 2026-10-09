import { useSurvey } from '../../context/SurveyContext'

/**
 * Línea flotante al pie. Su avance sigue una curva que no delata cuántos
 * bloques hay (ver lib/progress.ts).
 */
export default function ProgressBar() {
	const { progress } = useSurvey()
	const pct = Math.round(progress * 100)
	return (
		<div className="progress">
			<div
				className="progress__track"
				role="progressbar"
				aria-label="Avance de la encuesta"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div className="progress__fill" style={{ width: `${pct}%` }} />
			</div>
		</div>
	)
}
