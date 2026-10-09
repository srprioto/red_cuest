import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSurvey } from '../../context/SurveyContext'
import { BLOCKS } from '../../survey'

/**
 * Índice vertical de círculos. La descripción aparece al pasar el cursor.
 * Solo lista bloques ya respondidos y el actual: nunca muestra los que
 * faltan ni cuántos son.
 */
export default function BlockIndex() {
	const { metadata } = useSurvey()
	const { pathname } = useLocation()
	const navRef = useRef<HTMLElement>(null)
	const visible = BLOCKS.slice(0, Math.min(metadata.currentBlock + 1, BLOCKS.length))

	// Mantiene centrado el círculo activo cuando el índice tiene scroll
	useEffect(() => {
		const nav = navRef.current
		const active = nav?.querySelector<HTMLElement>('.index__link.is-active')
		if (!nav || !active) return
		const n = nav.getBoundingClientRect()
		const a = active.getBoundingClientRect()
		nav.scrollTo({
			top: nav.scrollTop + (a.top - n.top) - n.height / 2 + a.height / 2,
			behavior: 'smooth',
		})
	}, [pathname, metadata.currentBlock])

	return (
		<nav ref={navRef} className="index" aria-label="Índice de la encuesta">
			<ol className="index__list">
				{visible.map((b, i) => {
					const done = metadata.completedBlocks.includes(b.id)
					const startsPhase = i > 0 && visible[i - 1].phase !== b.phase
					return (
						<li
							key={b.id}
							data-phase={b.phase}
							className={startsPhase ? 'index__item--phase-start' : undefined}
						>
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
					<li className="index__item--phase-start">
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
