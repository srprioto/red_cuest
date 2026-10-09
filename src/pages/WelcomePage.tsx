import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { ORG_NAME } from '../config'
import { BLOCKS } from '../data/preguntas'
import { useSurvey } from '../context/SurveyContext'

export default function WelcomePage() {
  const { metadata, start } = useSurvey()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const label = metadata.finished ? 'Ver mis respuestas' : metadata.started ? 'Continuar encuesta' : 'Comenzar'

  const go = async () => {
    setError('')
    setBusy(true)
    const ok = await start()
    setBusy(false)
    if (!ok) return setError('No se pudo iniciar la encuesta. Revisa que el servidor esté activo e inténtalo otra vez.')
    if (metadata.finished) return navigate('/resumen')
    const target = BLOCKS[Math.min(metadata.currentBlock, BLOCKS.length - 1)]
    navigate(`/encuesta/${target.id}`)
  }

  return (
    <section className="welcome">
      <div className="welcome__panel">
        <Logo />
        <p className="welcome__org">{ORG_NAME}</p>
        <h1>Brechas tecnológicas en los establecimientos de salud</h1>
        <p className="welcome__lead">
          Con tus respuestas conoceremos qué equipos, redes y servicios tecnológicos tiene cada establecimiento de salud de
          Cusco, y dónde hacen falta.
        </p>
      </div>
      <div className="welcome__body">
        <ul className="welcome__notes">
          <li>Todas las preguntas son obligatorias. Si no tienes un equipo, escribe 0.</li>
          <li>Tu avance se guarda cada vez que presionas Siguiente. Puedes cerrar la página y continuar otro día.</li>
          <li>Puedes volver a los bloques que ya respondiste para corregirlos.</li>
        </ul>
        {metadata.started && !metadata.finished && <p className="welcome__resume">Tienes una encuesta en curso.</p>}
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn--primary btn--lg" onClick={go} disabled={busy}>
          {busy ? 'Un momento…' : label}
        </button>
      </div>
    </section>
  )
}
