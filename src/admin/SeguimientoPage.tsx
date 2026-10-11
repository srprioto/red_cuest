import { Download, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Estado } from '../types'
import { descargarUnificado, listarEstablecimientos } from './api'
import { useAdmin } from './AdminContext'
import { saveBlob, today } from './download'
import EstadoBadge from './EstadoBadge'
import { formatDate } from './format'
import { ESTADO_TEXTO, type FilaSeguimiento } from './types'

type Filtro = Estado | 'todos'

const FILTROS: { id: Filtro; label: string }[] = [
	{ id: 'todos', label: 'Todos' },
	{ id: 'completada', label: 'Completadas' },
	{ id: 'en_curso', label: 'En curso' },
	{ id: 'pendiente', label: 'Sin iniciar' },
]

/** Sin tildes ni mayúsculas, para que "canas" encuentre "CANAS" y "Cañas". */
const norm = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()

export default function SeguimientoPage() {
	const { call } = useAdmin()
	const [rows, setRows] = useState<FilaSeguimiento[] | null>(null)
	const [error, setError] = useState('')
	const [query, setQuery] = useState('')
	const [filtro, setFiltro] = useState<Filtro>('todos')
	const [descargando, setDescargando] = useState<'completadas' | 'todas' | null>(null)

	useEffect(() => {
		document.title = 'Seguimiento de establecimientos · Panel de administración'
		call(listarEstablecimientos)
			.then(setRows)
			.catch(() => setError('No se pudo cargar la lista de establecimientos.'))
	}, [call])

	// Texto donde se busca: código, nombre, ubicación, red, encargado y estado
	const indexed = useMemo(
		() =>
			(rows ?? []).map((r) => ({
				r,
				text: norm(
					[r.codigo, r.nombre, r.provincia, r.distrito, r.microred, r.red, r.encargado ?? '', ESTADO_TEXTO[r.estado]].join(' '),
				),
			})),
		[rows],
	)

	const searched = useMemo(() => {
		const terms = norm(query).split(/\s+/).filter(Boolean)
		return indexed.filter((x) => terms.every((t) => x.text.includes(t))).map((x) => x.r)
	}, [indexed, query])

	const filtered = filtro === 'todos' ? searched : searched.filter((r) => r.estado === filtro)
	const count = (f: Filtro) => (f === 'todos' ? searched.length : searched.filter((r) => r.estado === f).length)
	const completadas = filtered.filter((r) => r.estado === 'completada').length

	const descargar = async (modo: 'completadas' | 'todas') => {
		setError('')
		setDescargando(modo)
		try {
			const blob = await call((t) =>
				descargarUnificado(t, modo, filtered.map((r) => r.codigo)),
			)
			saveBlob(blob, `encuesta-${modo}-${today()}.xlsx`)
		} catch {
			setError('No se pudo generar el Excel. Inténtalo otra vez.')
		} finally {
			setDescargando(null)
		}
	}

	return (
		<div className="admin-page">
			<header className="admin-page__header">
				<h1>Seguimiento de establecimientos</h1>
				<p>Busca un establecimiento para ver en qué parte de la encuesta se quedó y descargar sus respuestas.</p>
			</header>

			<div className="admin-toolbar">
				<label className="search">
					<Search size={18} aria-hidden="true" />
					<input
						className="input"
						type="search"
						placeholder="Buscar por código, nombre, provincia, distrito, microred, red o encargado"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Buscar establecimientos"
					/>
				</label>

				<div className="chips" role="group" aria-label="Filtrar por estado">
					{FILTROS.map((f) => (
						<button
							key={f.id}
							type="button"
							className={`chip ${filtro === f.id ? 'is-active' : ''}`}
							aria-pressed={filtro === f.id}
							onClick={() => setFiltro(f.id)}
						>
							{f.label}
							<span className="chip__count">{rows ? count(f.id) : '…'}</span>
						</button>
					))}
				</div>

				<div className="admin-toolbar__downloads">
					<button
						type="button"
						className="btn btn--primary"
						disabled={completadas === 0 || descargando !== null}
						onClick={() => descargar('completadas')}
					>
						<Download size={18} />
						{descargando === 'completadas' ? 'Generando…' : `Descargar completadas (${completadas})`}
					</button>
					<button
						type="button"
						className="btn btn--outline"
						disabled={filtered.length === 0 || descargando !== null}
						onClick={() => descargar('todas')}
					>
						<Download size={18} />
						{descargando === 'todas' ? 'Generando…' : `Descargar todo, incluso vacíos (${filtered.length})`}
					</button>
				</div>
				<p className="admin-toolbar__note">
					Los Excel incluyen solo lo que muestra la lista con la búsqueda y el filtro actuales.
				</p>
			</div>

			{error && (
				<p className="block__alert" role="alert">
					{error}
				</p>
			)}

			{rows === null && !error && (
				<div className="state" role="status">
					<span className="spinner" aria-hidden="true" />
					Cargando establecimientos…
				</div>
			)}

			{rows !== null && filtered.length === 0 && (
				<p className="empty">
					{rows.length === 0
						? 'No hay establecimientos. Agrégalos en backend/data/establecimientos.json.'
						: 'Ningún establecimiento coincide con la búsqueda.'}
				</p>
			)}

			{filtered.length > 0 && (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Código</th>
								<th>Establecimiento</th>
								<th>Provincia</th>
								<th>Distrito</th>
								<th>Microred</th>
								<th>Red</th>
								<th>Estado</th>
								<th>Avance</th>
								<th>Última actividad</th>
								<th>
									<span className="sr-only">Acciones</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((r) => (
								<tr key={r.codigo}>
									<td className="admin-table__code">{r.codigo}</td>
									<td>
										<strong>{r.nombre}</strong>
										{r.encargado && <small>Encargado: {r.encargado}</small>}
									</td>
									<td>{r.provincia}</td>
									<td>{r.distrito}</td>
									<td>{r.microred}</td>
									<td>{r.red}</td>
									<td>
										<EstadoBadge estado={r.estado} />
									</td>
									<td>
										<div className="mini-progress" title={r.actual ? `Va en: ${r.actual}` : undefined}>
											<div className="mini-progress__track">
												<div className="mini-progress__fill" style={{ width: `${(r.completados / r.total) * 100}%` }} />
											</div>
											<span>
												{r.completados}/{r.total}
											</span>
										</div>
									</td>
									<td>{formatDate(r.actualizadoEn)}</td>
									<td>
										<Link className="icon-btn" to={`/panel_admin/establecimiento/${r.codigo}`}>
											Ver respuestas
										</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
