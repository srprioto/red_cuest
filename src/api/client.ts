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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, init)
	if (!res.ok) {
		let code = 'error'
		try {
			code = ((await res.json()) as { error?: string }).error ?? code
		} catch {
			// respuesta sin cuerpo
		}
		throw new ApiError(res.status, code)
	}
	return (await res.json()) as T
}

const json = (method: string, body: unknown): RequestInit => ({
	method,
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body),
})

/** Pseudo-login: valida el código IPRESS y trae (o crea) la encuesta. */
export const authenticate = (codigo: string, nombre: string) =>
	request<{ survey: SurveyFile; nuevo: boolean }>('/auth', json('POST', { codigo, nombre }))

export const loadSurvey = (codigo: string) =>
	request<SurveyFile>(`/encuesta/${encodeURIComponent(codigo)}`)

export const saveSurvey = (codigo: string, payload: SurveyPayload) =>
	request<{ ok: true }>(`/encuesta/${encodeURIComponent(codigo)}`, json('PUT', payload))
