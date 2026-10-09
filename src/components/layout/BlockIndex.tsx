import { Check } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { BLOCKS } from '../../data/preguntas'

/**
 * Índice vertical de círculos. La descripción aparece al pasar el cursor.
 * Solo lista bloques ya respondidos y el actual: nunca muestra los que
 * faltan ni cuántos son.
 */
export default function BlockIndex() {
  const { metadata } = useSurvey()
  const visible = BLOCKS.slice(0, Math.min(metadata.currentBlock + 1, BLOCKS.length))

  return (
    <nav className="index" aria-label="Índice de la encuesta">
      <ol className="index__list">
        {visible.map((b, i) => {
          const done = metadata.completedBlocks.includes(b.id)
          return (
            <li key={b.id}>
              <NavLink
                to={`/encuesta/${b.id}`}
                aria-label={b.title}
                className={({ isActive }) => `index__link ${isActive ? 'is-active' : ''}`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                <span className="index__label">{b.title}</span>
              </NavLink>
            </li>
          )
        })}
        {metadata.finished && (
          <li>
            <NavLink
              to="/resumen"
              aria-label="Resumen"
              className={({ isActive }) => `index__link ${isActive ? 'is-active' : ''}`}
            >
              <Check size={16} strokeWidth={3} />
              <span className="index__label">Resumen</span>
            </NavLink>
          </li>
        )}
      </ol>
    </nav>
  )
}
