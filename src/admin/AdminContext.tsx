import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { ApiError } from '../api/client'
import { adminLogin, adminSession, readToken, storeToken } from './api'

type Status = 'checking' | 'ready'

type AdminLoginResult = { ok: true } | { ok: false; error: string }

interface AdminContextValue {
	status: Status
	/** null = nadie ha iniciado sesión. */
	usuario: string | null
	token: string | null
	login: (usuario: string, password: string) => Promise<AdminLoginResult>
	/** Inicia sesión con un token que ya se tiene (primer registro). */
	startSession: (token: string, usuario: string) => void
	logout: () => void
	/** Ejecuta una llamada con el token; si venció la sesión, vuelve al ingreso. */
	call: <T>(fn: (token: string) => Promise<T>) => Promise<T>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<Status>(() => (readToken() ? 'checking' : 'ready'))
	const [usuario, setUsuario] = useState<string | null>(null)
	const [token, setToken] = useState<string | null>(null)

	// Al abrir: si había una sesión guardada, se valida contra el servidor.
	useEffect(() => {
		const stored = readToken()
		if (!stored) return
		adminSession(stored)
			.then((s) => {
				setToken(stored)
				setUsuario(s.usuario)
			})
			.catch(() => storeToken(null))
			.finally(() => setStatus('ready'))
	}, [])

	const startSession = useCallback((newToken: string, name: string) => {
		storeToken(newToken)
		setToken(newToken)
		setUsuario(name)
	}, [])

	const logout = useCallback(() => {
		storeToken(null)
		setToken(null)
		setUsuario(null)
	}, [])

	const login = useCallback(
		async (user: string, password: string): Promise<AdminLoginResult> => {
			try {
				const res = await adminLogin(user, password)
				startSession(res.token, res.usuario)
				return { ok: true }
			} catch (err) {
				return { ok: false, error: err instanceof ApiError ? err.code : 'servidor_no_disponible' }
			}
		},
		[startSession],
	)

	const call = useCallback(
		async <T,>(fn: (t: string) => Promise<T>): Promise<T> => {
			if (!token) throw new ApiError(401, 'no_autorizado')
			try {
				return await fn(token)
			} catch (err) {
				if (err instanceof ApiError && err.status === 401) logout()
				throw err
			}
		},
		[token, logout],
	)

	const value = useMemo(
		() => ({ status, usuario, token, login, startSession, logout, call }),
		[status, usuario, token, login, startSession, logout, call],
	)
	return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
	const ctx = useContext(AdminContext)
	if (!ctx) throw new Error('useAdmin debe usarse dentro de <AdminProvider>')
	return ctx
}
