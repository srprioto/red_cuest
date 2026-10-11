/**
 * Autenticación del panel de administración.
 *
 * - Contraseñas: scrypt con sal (viene con Node, no necesita dependencias).
 *   Se usa en lugar de MD5 porque MD5 se puede revertir con tablas ya calculadas.
 * - Sesión: token firmado con HMAC-SHA256 que vence a las 12 horas.
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { Request, RequestHandler } from 'express'
import { getSecret, readUsers } from './storage.js'

const KEY_LENGTH = 64
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

const scryptAsync = (password: string, salt: Buffer, length: number) =>
	new Promise<Buffer>((resolve, reject) => {
		scrypt(password, salt, length, (err, key) => (err ? reject(err) : resolve(key)))
	})

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16)
	const hash = await scryptAsync(password, salt, KEY_LENGTH)
	return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [alg, saltHex, hashHex] = stored.split('$')
	if (alg !== 'scrypt' || !saltHex || !hashHex) return false
	const expected = Buffer.from(hashHex, 'hex')
	const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)
	return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const sign = async (payload: string) =>
	createHmac('sha256', await getSecret()).update(payload).digest('base64url')

export async function signToken(usuario: string): Promise<string> {
	const payload = Buffer.from(JSON.stringify({ u: usuario, exp: Date.now() + TOKEN_TTL_MS })).toString(
		'base64url',
	)
	return `${payload}.${await sign(payload)}`
}

/** Devuelve el usuario si el token es válido, no venció y el usuario sigue existiendo. */
export async function verifyToken(token: string | null): Promise<string | null> {
	if (!token) return null
	const [payload, signature] = token.split('.')
	if (!payload || !signature) return null

	const expected = Buffer.from(await sign(payload))
	const received = Buffer.from(signature)
	if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

	try {
		const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
			u?: unknown
			exp?: unknown
		}
		if (typeof u !== 'string' || typeof exp !== 'number' || exp < Date.now()) return null
		return (await readUsers()).some((user) => user.usuario === u) ? u : null
	} catch {
		return null
	}
}

export function bearer(req: Request): string | null {
	const header = req.headers.authorization
	return header?.startsWith('Bearer ') ? header.slice(7) : null
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
	try {
		const usuario = await verifyToken(bearer(req))
		if (!usuario) return void res.status(401).json({ error: 'no_autorizado' })
		res.locals.usuario = usuario
		next()
	} catch (err) {
		next(err)
	}
}

// ---------- Freno a intentos fallidos de ingreso ----------
const MAX_FAILURES = 5
const LOCK_MS = 60_000
const failures = new Map<string, { count: number; until: number }>()

export const isLocked = (key: string) => (failures.get(key)?.until ?? 0) > Date.now()

export function recordFailure(key: string) {
	const entry = failures.get(key) ?? { count: 0, until: 0 }
	entry.count += 1
	if (entry.count >= MAX_FAILURES) {
		entry.count = 0
		entry.until = Date.now() + LOCK_MS
	}
	failures.set(key, entry)
}

export const clearFailures = (key: string) => failures.delete(key)
