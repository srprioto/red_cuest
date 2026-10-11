import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminProvider, useAdmin } from './AdminContext'
import AdminLayout from './AdminLayout'
import AdminLoginPage from './AdminLoginPage'
import DetallePage from './DetallePage'
import SeguimientoPage from './SeguimientoPage'

/** Muestra el ingreso si no hay sesión; si la hay, el panel con su menú. */
function AdminGuard() {
	const { status, usuario } = useAdmin()

	if (status === 'checking') {
		return (
			<div className="state" role="status">
				<span className="spinner" aria-hidden="true" />
				Cargando…
			</div>
		)
	}
	if (!usuario) return <AdminLoginPage />

	return (
		<AdminLayout>
			<Outlet />
		</AdminLayout>
	)
}

/** Todo lo que vive bajo /panel_admin. */
export default function AdminApp() {
	return (
		<AdminProvider>
			<Routes>
				<Route element={<AdminGuard />}>
					<Route index element={<SeguimientoPage />} />
					<Route path="establecimiento/:codigo" element={<DetallePage />} />
				</Route>
				<Route path="*" element={<Navigate to="/panel_admin" replace />} />
			</Routes>
		</AdminProvider>
	)
}
