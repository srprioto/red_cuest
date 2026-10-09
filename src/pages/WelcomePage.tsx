import { useNavigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { ORG_NAME } from '../config'
import { useSurvey } from '../context/SurveyContext'
import { resumeTarget } from '../lib/navigation'

export default function WelcomePage() {
	const { session, metadata } = useSurvey()
	const navigate = useNavigate()

	const label = !session ? 'Comenzar' : metadata.finished ? 'Ver mis respuestas' : 'Continuar encuesta'
	const go = () => navigate(session ? resumeTarget(metadata) : '/ingreso')

	return (
		<section className="welcome">
			<div className="welcome__panel">
				<Logo />
				<p className="welcome__org">{ORG_NAME}</p>
				<h1>Encuesta sobre brechas tecnológicas en los establecimientos de salud</h1>
				<p className="welcome__lead">
					Con tus respuestas conoceremos qué equipos, redes y servicios tecnológicos tiene cada establecimiento de salud de
					Cusco, y dónde hacen falta.
				</p>
			</div>
			<div className="welcome__body">
				<ul className="welcome__notes">
					<li>Necesitarás el código IPRESS de tu establecimiento para ingresar.</li>
					<li>Todas las preguntas son obligatorias. Si no tienes un equipo, escribe 0.</li>
					<li>Tu avance se guarda cada vez que presionas Siguiente. Puedes cerrar la página y continuar otro día con el mismo código.</li>
					<li>Puedes volver a los bloques que ya respondiste para corregirlos.</li>
				</ul>
				{session && (
					<p className="welcome__resume">
						{metadata.finished ? 'Encuesta completada' : 'Tienes una encuesta en curso'} · {session.encargado}
					</p>
				)}
				<button type="button" className="btn btn--primary btn--lg" onClick={go}>
					{label}
				</button>
			</div>
		</section>
	)
}
