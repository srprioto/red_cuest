/**
 * Acceso a los archivos JSON del backend.
 *
 *   backend/data/establecimientos.json    -> lista maestra (se llena a mano) + estado de cada uno
 *   backend/data/encuestas/<codigo>.json  -> una encuesta por establecimiento
 *   backend/data/users.json               -> usuarios del panel de administración
 *   backend/data/.secret                  -> clave para firmar sesiones (se crea sola)
 */
import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Estado, EstablecimientoInfo, SurveyFile } from '../src/types'

const DATA_DIR = path.resolve(process.cwd(), 'backend/data')
const ESTABLECIMIENTOS_FILE = path.join(DATA_DIR, 'establecimientos.json')
const ENCUESTAS_DIR = path.join(DATA_DIR, 'encuestas')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const SECRET_FILE = path.join(DATA_DIR, '.secret')

/** Una fila de establecimientos.json, con las llaves tal como se escriben a mano. */
interface EstablecimientoRaw {
	[key: string]: unknown
	'CODIGO IPRESS'?: unknown
	ESTADO?: Estado
	'ACTUALIZADO EN'?: string
}

export type Establecimiento = EstablecimientoInfo

interface AdminUser {
	usuario: string
	password: string
	creadoEn: string
}

/** 2420 -> "00002420". Devuelve null si no son solo dígitos (máx. 8). */
export function normalizeCodigo(raw: unknown): string | null {
	const text = typeof raw === 'number' && Number.isInteger(raw) ? String(raw) : raw
	if (typeof text !== 'string') return null
	const digits = text.trim()
	if (!/^\d{1,8}$/.test(digits)) return null
	return digits.padStart(8, '0')
}

async function readJson<T>(file: string): Promise<T | null> {
	try {
		const raw = await fs.readFile(file, 'utf-8')
		return raw.trim() ? (JSON.parse(raw) as T) : null
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
		throw err
	}
}

const writeJson = (file: string, data: unknown) =>
	fs.writeFile(file, JSON.stringify(data, null, '\t'), 'utf-8')

// Las escrituras se hacen de una en una para no corromper archivos.
let queue: Promise<unknown> = Promise.resolve()
export function enqueue<T>(task: () => Promise<T>): Promise<T> {
	const run = queue.then(task)
	queue = run.catch(() => undefined)
	return run
}

// ---------- Establecimientos ----------
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim())

function toEstablecimiento(raw: EstablecimientoRaw): Establecimiento | null {
	const codigo = normalizeCodigo(raw['CODIGO IPRESS'])
	if (!codigo) return null
	return {
		codigo,
		nombre: text(raw['NOMBRE DEL ESTABLECIMIENTO']),
		provincia: text(raw.PROVINCIA),
		distrito: text(raw.DISTRITO),
		red: text(raw.RED),
		microred: text(raw.MICRORED),
		categoria: text(raw.CATEGORIA),
	}
}

const readRaw = async () => (await readJson<EstablecimientoRaw[]>(ESTABLECIMIENTOS_FILE)) ?? []

/** Lista válida y sin códigos repetidos (si se repite, gana el primero). */
export async function readEstablecimientos(): Promise<Establecimiento[]> {
	const seen = new Set<string>()
	const out: Establecimiento[] = []
	for (const raw of await readRaw()) {
		const est = toEstablecimiento(raw)
		if (!est || seen.has(est.codigo)) continue
		seen.add(est.codigo)
		out.push(est)
	}
	return out
}

export async function findEstablecimiento(codigo: string): Promise<Establecimiento | undefined> {
	return (await readEstablecimientos()).find((e) => e.codigo === codigo)
}

/**
 * Escribe el estado sobre el item del establecimiento (campos ESTADO y
 * "ACTUALIZADO EN"). Solo escribe si cambió. No usa enqueue: llamar dentro de uno.
 */
export async function setEstado(codigo: string, estado: Estado): Promise<void> {
	const list = await readRaw()
	const raw = list.find((r) => normalizeCodigo(r['CODIGO IPRESS']) === codigo)
	if (!raw || raw.ESTADO === estado) return
	raw.ESTADO = estado
	raw['ACTUALIZADO EN'] = new Date().toISOString()
	await writeJson(ESTABLECIMIENTOS_FILE, list)
}

// ---------- Encuestas ----------
const surveyPath = (codigo: string) => path.join(ENCUESTAS_DIR, `${codigo}.json`)

export const readSurvey = (codigo: string) => readJson<SurveyFile>(surveyPath(codigo))

export async function writeSurvey(codigo: string, survey: SurveyFile): Promise<void> {
	await fs.mkdir(ENCUESTAS_DIR, { recursive: true })
	await writeJson(surveyPath(codigo), survey)
}

// ---------- Usuarios del panel ----------
export async function readUsers(): Promise<AdminUser[]> {
	return (await readJson<AdminUser[]>(USERS_FILE)) ?? []
}

export const writeUsers = (users: AdminUser[]) => writeJson(USERS_FILE, users)

// ---------- Clave para firmar sesiones ----------
let secretPromise: Promise<string> | null = null
export function getSecret(): Promise<string> {
	secretPromise ??= (async () => {
		try {
			const existing = (await fs.readFile(SECRET_FILE, 'utf-8')).trim()
			if (existing) return existing
		} catch {
			// no existe todavía
		}
		const secret = randomBytes(32).toString('hex')
		await fs.mkdir(DATA_DIR, { recursive: true })
		await fs.writeFile(SECRET_FILE, secret, 'utf-8')
		return secret
	})()
	return secretPromise
}
