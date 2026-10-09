import { useSurvey } from '../../context/SurveyContext'

/** Línea fija al pie. Muestra avance sin revelar cantidades. */
export default function ProgressBar() {
  const { progress } = useSurvey()
  const pct = Math.round(progress * 100)
  return (
    <div className="progress" role="progressbar" aria-label="Avance de la encuesta" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
