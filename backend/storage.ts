/**
 * Acceso a los archivos JSON del backend.
 *
 *   backend/data/ipress.json            -> lista maestra de códigos IPRESS y su estado
 *   backend/data/encuestas/<codigo>.json -> una encuesta por establecimiento
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const DATA_DIR = path.resolve(process.cwd(), 'backend/data')
export const IPRESS_FILE = path.join(DATA_DIR, 'ipress.json')
export const ENCUESTAS_DIR = path.join(DATA_DIR, 'encuestas')

export type Estado = 'pendiente' | 'en_curso' | 'completada'

export interface IpressEntry {
	codigo: string
	estado: Estado
	nombre?: string
	actualizadoEn?: string
}

export interface SurveyFile {
	ipress: string
	encargado: string
	creadoEn: string
	actualizadoEn: string
	metadata: Record<string, unknown>
	answers: Record<string, unknown>
}

/** "2420" -> "00002420". Devuelve null si no son solo dígitos (máx. 8). */
export function normalizeCodigo(raw: unknown): string | null {
	if (typeof raw !== 'string') return null
	const digits = raw.trim()
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

// ---------- Lista maestra de IPRESS ----------
export async function readIpressList(): Promise<IpressEntry[]> {
	return (await readJson<IpressEntry[]>(IPRESS_FILE)) ?? []
}

export const writeIpressList = (list: IpressEntry[]) => writeJson(IPRESS_FILE, list)

export async function findIpress(codigo: string): Promise<IpressEntry | undefined> {
	return (await readIpressList()).find((e) => e.codigo === codigo)
}

/** Cambia el estado solo si es distinto. No usa enqueue: llamar dentro de uno. */
export async function setEstado(codigo: string, estado: Estado): Promise<void> {
	const list = await readIpressList()
	const entry = list.find((e) => e.codigo === codigo)
	if (!entry || entry.estado === estado) return
	entry.estado = estado
	entry.actualizadoEn = new Date().toISOString()
	await writeIpressList(list)
}

// ---------- Encuestas ----------
const surveyPath = (codigo: string) => path.join(ENCUESTAS_DIR, `${codigo}.json`)

export const readSurvey = (codigo: string) => readJson<SurveyFile>(surveyPath(codigo))

export async function writeSurvey(codigo: string, survey: SurveyFile): Promise<void> {
	await fs.mkdir(ENCUESTAS_DIR, { recursive: true })
	await writeJson(surveyPath(codigo), survey)
}
