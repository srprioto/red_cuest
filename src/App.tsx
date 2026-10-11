import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminApp from './admin/AdminApp'
import { AdminProvider } from './admin/AdminContext'
import RegisterPage from './admin/RegisterPage'
import AppShell from './components/layout/AppShell'
import { SurveyProvider, useSurvey } from './context/SurveyContext'
import BlockPage from './pages/BlockPage'
import LoginPage from './pages/LoginPage'
import PhaseIntroPage from './pages/PhaseIntroPage'
import SummaryPage from './pages/SummaryPage'
import WelcomePage from './pages/WelcomePage'

function AnimatedRoutes() {
	const location = useLocation()
	const reduceMotion = useReducedMotion()
	const offset = reduceMotion ? '0%' : '100%'

	// La página anterior sale hacia la izquierda y la nueva entra desde la derecha.
	// mode="popLayout": ambas se mueven a la vez (la que sale se saca del flujo).
	return (
		<AnimatePresence mode="popLayout" initial={false}>
			<motion.div
				key={location.pathname}
				initial={{ x: offset, opacity: 0 }}
				animate={{ x: '0%', opacity: 1 }}
				exit={{ x: `-${offset}`, opacity: 0 }}
				transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
			>
				<Routes location={location}>
					<Route path="/" element={<WelcomePage />} />
					<Route path="/ingreso" element={<LoginPage />} />
					<Route path="/encuesta/:blockId" element={<BlockPage />} />
					<Route path="/parte/:phase" element={<PhaseIntroPage />} />
					<Route path="/resumen" element={<SummaryPage />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</motion.div>
		</AnimatePresence>
	)
}

function Content() {
	const { status, reload } = useSurvey()

	return (
		<AppShell>
			{status === 'loading' && (
				<div className="state" role="status">
					<span className="spinner" aria-hidden="true" />
					Cargando encuesta…
				</div>
			)}
			{status === 'error' && (
				<div className="state" role="alert">
					<h1>No se pudo conectar con el servidor</h1>
					<p>Verifica que la aplicación esté corriendo con <code>pnpm dev</code> y vuelve a intentarlo.</p>
					<button type="button" className="btn btn--primary" onClick={reload}>
						Reintentar
					</button>
				</div>
			)}
			{status === 'ready' && <AnimatedRoutes />}
		</AppShell>
	)
}

/** Encuesta para los establecimientos (pseudo-login con código IPRESS). */
function SurveyApp() {
	return (
		<SurveyProvider>
			<Content />
		</SurveyProvider>
	)
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/panel_admin/*" element={<AdminApp />} />
				<Route
					path="/register"
					element={
						<AdminProvider>
							<RegisterPage />
						</AdminProvider>
					}
				/>
				<Route path="*" element={<SurveyApp />} />
			</Routes>
		</BrowserRouter>
	)
}



// /panel_admin
// /register