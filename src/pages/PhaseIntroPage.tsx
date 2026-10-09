import { ChevronRight } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { useSurvey } from '../context/SurveyContext'
import { resumeTarget } from '../lib/navigation'
import { BLOCKS, PHASES, firstBlockIndex, isPhase } from '../survey'

/**
 * Pantalla de transición entre partes. Solo es accesible cuando la parte
 * anterior ya se completó: no revela que existe antes de tiempo.
 */
export default function PhaseIntroPage() {
	const { phase } = useParams()
	const { session, metadata } = useSurvey()
	const navigate = useNavigate()

	if (!session) return <Navigate to="/ingreso" replace />
	const first = isPhase(phase) ? firstBlockIndex(phase) : -1
	if (!isPhase(phase) || first <= 0 || metadata.currentBlock < first) {
		return <Navigate to={resumeTarget(metadata)} replace />
	}

	const info = PHASES[phase]
	return (
		<section className="welcome">
			<div className="welcome__panel">
				<Logo />
				<p className="welcome__org">{info.label}</p>
				<h1>{info.title}</h1>
				<p className="welcome__lead">{info.intro}</p>
			</div>
			<div className="welcome__body">
				<button
					type="button"
					className="btn btn--primary btn--lg"
					onClick={() => navigate(`/encuesta/${BLOCKS[first].id}`)}
				>
					Continuar
					<ChevronRight size={20} />
				</button>
			</div>
		</section>
	)
}
