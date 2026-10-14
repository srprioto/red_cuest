import { ChevronRight } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSurvey } from '../context/SurveyContext'
import { BLOCKS } from '../survey'

/**
 * Paso previo a la encuesta: muestra los datos del establecimiento que
 * corresponden al código IPRESS ingresado, para que el jefe los verifique.
 */
export default function EstablecimientoPage() {
	const navigate = useNavigate()
	const { session, logout } = useSurvey()
	if (!session) return <Navigate to="/ingreso" replace />

	const est = session.establecimiento
	const continuar = () => navigate(`/encuesta/${BLOCKS[0].id}`)
	const noEsMio = () => {
		logout()
		navigate('/ingreso')
	}

	const datos = est
		? [
				{ label: 'Provincia', value: est.provincia },
				{ label: 'Distrito', value: est.distrito },
				{ label: 'Red', value: est.red },
				{ label: 'Microred', value: est.microred },
			]
		: []

	return (
		<section className="block">
			<header className="block__header">
				<p className="block__eyebrow">Tu establecimiento</p>
				<h1>{est?.nombre ?? `IPRESS ${session.ipress}`}</h1>
				<p>Verifica que estos datos correspondan a tu establecimiento antes de continuar.</p>
			</header>

			<div className="block__card est-card">
				<div className="est-card__top">
					<div className="est-card__code">
						<span>Código IPRESS</span>
						<strong>{session.ipress}</strong>
					</div>
					<div className="est-card__category">
						<span>Categoría</span>
						<b className="est-pill">{est?.categoria || 'Sin categoría'}</b>
					</div>
				</div>

				{datos.length > 0 && (
					<dl className="est-grid">
						{datos.map((d) => (
							<div key={d.label}>
								<dt>{d.label}</dt>
								<dd>{d.value || '—'}</dd>
							</div>
						))}
					</dl>
				)}
			</div>

			<footer className="block__footer est-actions">
				<button type="button" className="btn btn--outline btn--lg" onClick={noEsMio}>
					No es mi establecimiento
				</button>
				<button type="button" className="btn btn--primary btn--lg" onClick={continuar}>
					Los datos son correctos
					<ChevronRight size={20} />
				</button>
			</footer>
		</section>
	)
}
