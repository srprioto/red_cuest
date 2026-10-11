import { API_BASE } from '../config'
import type { SurveyFile, SurveyPayload } from '../types'

/** Error devuelto por el servidor. `code` es el texto de `error` (ej. codigo_no_registrado). */
export class ApiError extends Error {
	readonly status: number
	readonly code: string

	constructor(status: number, code: string) {
		super(code)
		this.status = status
		this.code = code
	}
}

async function send(path: string, init?: RequestInit): Promise<Response> {
	const res = await fetch(`${API_BASE}${path}`, init)
	if (!res.ok) {
		// Si la respuesta no trae un { error } del backend (por ejemplo un 502 de Vite
		// porque la API no está corriendo), se considera servidor no disponible.
		let code = 'servidor_no_disponible'
		try {
			const body = (await res.json()) as { error?: string }
			if (body.error) code = body.error
		} catch {
			// sin cuerpo JSON
		}
		throw new ApiError(res.status, code)
	}
	return res
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
	return (await (await send(path, init)).json()) as T
}

/** Para descargas (Excel). */
export async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
	return (await send(path, init)).blob()
}

export const jsonInit = (
	method: string,
	body: unknown,
	headers?: Record<string, string>,
): RequestInit => ({
	method,
	headers: { 'Content-Type': 'application/json', ...headers },
	body: JSON.stringify(body),
})

/** Pseudo-login: valida el código IPRESS y trae (o crea) la encuesta. */
export const authenticate = (codigo: string, nombre: string) =>
	request<{ survey: SurveyFile; nuevo: boolean }>('/auth', jsonInit('POST', { codigo, nombre }))

export const loadSurvey = (codigo: string) =>
	request<SurveyFile>(`/encuesta/${encodeURIComponent(codigo)}`)

export const saveSurvey = (codigo: string, payload: SurveyPayload) =>
	request<{ ok: true }>(`/encuesta/${encodeURIComponent(codigo)}`, jsonInit('PUT', payload))
