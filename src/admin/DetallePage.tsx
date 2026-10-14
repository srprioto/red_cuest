import { ArrowLeft, Check, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Comparison, PhaseSections } from '../components/summary/SummaryParts'
import { PHASES, PHASE_ORDER } from '../survey'
import { describeProgress } from '../survey/progreso'
import { descargarResumen, detalleEstablecimiento } from './api'
import { useAdmin } from './AdminContext'
import { saveBlob } from './download'
import EstadoBadge from './EstadoBadge'
import { formatDate } from './format'
import type { DetalleEstablecimiento } from './types'

/** `key` reinicia el estado al cambiar de establecimiento. */
export default function DetallePage() {
	const { codigo = '' } = useParams()
	return <DetalleContent key={codigo} codigo={codigo} />
}

function DetalleContent({ codigo }: { codigo: string }) {
	const { call } = useAdmin()
	const [detalle, setDetalle] = useState<DetalleEstablecimiento | null>(null)
	const [error, setError] = useState('')
	const [descargando, setDescargando] = useState(false)

	useEffect(() => {
		document.title = `Establecimiento ${codigo} · Panel de administración`
		call((t) => detalleEstablecimiento(t, codigo))
			.then(setDetalle)
			.catch((err) =>
				setError(
					err instanceof ApiError && err.status === 404
						? 'Este establecimiento no está en la lista.'
						: 'No se pudo cargar el establecimiento.',
				),
			)
	}, [call, codigo])

	const progreso = useMemo(
		() => describeProgress(detalle?.survey?.metadata, !!detalle?.survey),
		[detalle],
	)

	const descargar = async () => {
		setError('')
		setDescargando(true)
		try {
			saveBlob(await call((t) => descargarResumen(t, codigo)), `resumen-${codigo}.xlsx`)
		} catch {
			setError('No se pudo generar el Excel. Inténtalo otra vez.')
		} finally {
			setDescargando(false)
		}
	}

	const back = (
		<Link to="/panel_admin" className="admin-back">
			<ArrowLeft size={16} />
			Volver al seguimiento
		</Link>
	)

	if (error && !detalle) {
		return (
			<div className="admin-page">
				{back}
				<p className="block__alert" role="alert">
					{error}
				</p>
			</div>
		)
	}
	if (!detalle) {
		return (
			<div className="admin-page">
				{back}
				<div className="state" role="status">
					<span className="spinner" aria-hidden="true" />
					Cargando…
				</div>
			</div>
		)
	}

	const { establecimiento: est, survey } = detalle
	const pct = Math.round((progreso.completados / progreso.total) * 100)

	return (
		<div className="admin-page">
			{back}

			<header className="admin-page__header admin-page__header--row">
				<div>
					<p className="block__eyebrow">IPRESS {est.codigo}</p>
					<h1>{est.nombre}</h1>
				</div>
				<div className="admin-page__actions">
					<EstadoBadge estado={progreso.estado} />
					<button type="button" className="btn btn--primary" disabled={descargando} onClick={descargar}>
						<Download size={18} />
						{descargando ? 'Generando…' : 'Descargar resumen (Excel)'}
					</button>
				</div>
			</header>

			{error && (
				<p className="block__alert" role="alert">
					{error}
				</p>
			)}

			<section className="panel-card">
				<h2>Datos del establecimiento</h2>
				<dl className="detail-grid">
					<div><dt>Provincia</dt><dd>{est.provincia || '—'}</dd></div>
					<div><dt>Distrito</dt><dd>{est.distrito || '—'}</dd></div>
					<div><dt>Microred</dt><dd>{est.microred || '—'}</dd></div>
					<div><dt>Red</dt><dd>{est.red || '—'}</dd></div>
					<div><dt>Categoría</dt><dd>{est.categoria || '—'}</dd></div>
					<div><dt>Jefe del establecimiento</dt><dd>{survey?.encargado ?? '—'}</dd></div>
					<div><dt>Fecha de inicio</dt><dd>{formatDate(survey?.creadoEn ?? null)}</dd></div>
					<div><dt>Última actividad</dt><dd>{formatDate(survey?.actualizadoEn ?? null)}</dd></div>
					<div>
						<dt>Finalización</dt>
						<dd>{progreso.finished ? formatDate(survey?.metadata.finishedAt ?? null) : '—'}</dd>
					</div>
				</dl>
			</section>

			<section className="panel-card">
				<h2>Avance de la encuesta</h2>
				{!survey ? (
					<p className="empty empty--inline">
						Este establecimiento aún no inicia la encuesta. Todavía no hay respuestas.
					</p>
				) : (
					<>
						<p className="progress-lg__text">
							<strong>
								{progreso.completados} de {progreso.total} bloques
							</strong>{' '}
							({pct}%)
							{progreso.finished
								? ' · Encuesta completada'
								: progreso.actual && ` · Se quedó en: ${progreso.actual}`}
						</p>
						<div className="progress-lg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
							<div className="progress-lg__fill" style={{ width: `${pct}%` }} />
						</div>
					</>
				)}

				<div className="block-status">
					{PHASE_ORDER.map((phase) => (
						<div key={phase} data-phase={phase}>
							<h3 className="block-status__title">{PHASES[phase].title}</h3>
							<ul>
								{progreso.bloques
									.filter((b) => b.phase === phase)
									.map((b) => (
										<li key={b.id} className={b.done ? 'is-done' : undefined}>
											<span className="block-status__mark">
												{b.done && <Check size={14} strokeWidth={3} />}
											</span>
											{b.title}
											{!b.done && survey && progreso.actual === b.title && (
												<em>aquí se quedó</em>
											)}
										</li>
									))}
							</ul>
						</div>
					))}
				</div>
			</section>

			{survey && (
				<>
					<Comparison answers={survey.answers} />
					<PhaseSections answers={survey.answers} editable={false} totals={progreso.finished} />
				</>
			)}
		</div>
	)
}
