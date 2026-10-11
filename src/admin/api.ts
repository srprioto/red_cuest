import { jsonInit, request, requestBlob } from '../api/client'
import type { DetalleEstablecimiento, FilaSeguimiento } from './types'

const TOKEN_KEY = 'geresa.admin'

export function readToken(): string | null {
	try {
		return localStorage.getItem(TOKEN_KEY)
	} catch {
		return null
	}
}

export function storeToken(token: string | null) {
	try {
		if (token) localStorage.setItem(TOKEN_KEY, token)
		else localStorage.removeItem(TOKEN_KEY)
	} catch {
		// sin almacenamiento: la sesión dura mientras la página siga abierta
	}
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

export const adminLogin = (usuario: string, password: string) =>
	request<{ token: string; usuario: string }>('/admin/login', jsonInit('POST', { usuario, password }))

export const adminSession = (token: string) =>
	request<{ usuario: string }>('/admin/session', { headers: auth(token) })

export const registroEstado = () => request<{ hayUsuarios: boolean }>('/admin/registro-estado')

export const adminRegister = (usuario: string, password: string, token: string | null) =>
	request<{ ok: true; token?: string; usuario?: string }>(
		'/admin/register',
		jsonInit('POST', { usuario, password }, token ? auth(token) : undefined),
	)

export const listarEstablecimientos = (token: string) =>
	request<FilaSeguimiento[]>('/admin/establecimientos', { headers: auth(token) })

export const detalleEstablecimiento = (token: string, codigo: string) =>
	request<DetalleEstablecimiento>(`/admin/establecimientos/${encodeURIComponent(codigo)}`, {
		headers: auth(token),
	})

export const descargarResumen = (token: string, codigo: string) =>
	requestBlob(`/admin/establecimientos/${encodeURIComponent(codigo)}/excel`, {
		headers: auth(token),
	})

export const descargarUnificado = (
	token: string,
	modo: 'completadas' | 'todas',
	codigos: string[],
) => requestBlob('/admin/exportar', jsonInit('POST', { modo, codigos }, auth(token)))
