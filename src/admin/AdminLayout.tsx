import { ClipboardList, LogOut, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { ORG_NAME } from '../config'
import { useAdmin } from './AdminContext'

/** Estructura del panel: menú a la izquierda y contenido a la derecha. */
export default function AdminLayout({ children }: { children: ReactNode }) {
	const { usuario, logout } = useAdmin()

	return (
		<div className="admin">
			<aside className="admin__menu">
				<Link to="/panel_admin" className="admin__brand">
					<Logo small />
					<span>
						<strong>{ORG_NAME}</strong>
						<small>Panel de administración</small>
					</span>
				</Link>

				<nav className="admin__nav" aria-label="Menú del panel">
					<NavLink to="/panel_admin" end className="admin__link">
						<ClipboardList size={18} />
						Seguimiento de establecimientos
					</NavLink>
					<Link to="/register" className="admin__link">
						<UserPlus size={18} />
						Crear usuario
					</Link>
				</nav>

				<div className="admin__user">
					<span>{usuario}</span>
					<button type="button" className="icon-btn" onClick={logout}>
						<LogOut size={16} />
						<span>Salir</span>
					</button>
				</div>
			</aside>
			<main className="admin__main">{children}</main>
		</div>
	)
}
