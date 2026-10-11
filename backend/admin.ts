/**
 * Rutas del panel de administración (/api/admin/*).
 * Públicas: registro-estado, register (con reglas), login.
 * Todo lo demás exige sesión de administrador.
 */
import { Router, type Response } from 'express'
import type ExcelJS from 'exceljs'
import type { DetalleEstablecimiento } from '../src/admin/types'
import {
	bearer,
	clearFailures,
	hashPassword,
	isLocked,
	recordFailure,
	requireAdmin,
	signToken,
	verifyPassword,
	verifyToken,
} from './auth.js'
import { buildResumen, buildUnificado } from './excel.js'
import { buildFila, cargarFilas, toFilaSeguimiento } from './seguimiento.js'
import {
	enqueue,
	findEstablecimiento,
	normalizeCodigo,
	readSurvey,
	readUsers,
	writeUsers,
} from './storage.js'

export const adminRouter = Router()

const USUARIO_RE = /^[a-z0-9._-]{3,32}$/
const normalizeUsuario = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '')

async function sendWorkbook(res: Response, wb: ExcelJS.Workbook, filename: string) {
	res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
	await wb.xlsx.write(res)
	res.end()
}

const today = () => new Date().toISOString().slice(0, 10)

// ---------- Públicas ----------

/** Para saber si /register está abierto (primer usuario) o restringido. */
adminRouter.get('/registro-estado', async (_req, res) => {
	res.json({ hayUsuarios: (await readUsers()).length > 0 })
})

/**
 * Crea un usuario. Es abierto SOLO mientras no exista ninguno (el primero queda
 * con sesión iniciada); después exige que quien registra ya sea administrador.
 */
adminRouter.post('/register', async (req, res) => {
	const body = (req.body ?? {}) as Record<string, unknown>
	const usuario = normalizeUsuario(body.usuario)
	const password = typeof body.password === 'string' ? body.password : ''

	if (!USUARIO_RE.test(usuario)) return void res.status(400).json({ error: 'usuario_invalido' })
	if (password.length < 8 || password.length > 128) {
		return void res.status(400).json({ error: 'password_invalido' })
	}

	try {
		const result = await enqueue(async () => {
			const users = await readUsers()
			if (users.length > 0) {
				const caller = await verifyToken(bearer(req))
				if (!caller) return 'restringido' as const
			}
			if (users.some((u) => u.usuario === usuario)) return 'existe' as const
			users.push({
				usuario,
				password: await hashPassword(password),
				creadoEn: new Date().toISOString(),
			})
			await writeUsers(users)
			return { primero: users.length === 1 }
		})

		if (result === 'restringido') return void res.status(403).json({ error: 'registro_restringido' })
		if (result === 'existe') return void res.status(409).json({ error: 'usuario_existe' })
		res.json({ ok: true, ...(result.primero ? { token: await signToken(usuario), usuario } : {}) })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

adminRouter.post('/login', async (req, res) => {
	const body = (req.body ?? {}) as Record<string, unknown>
	const usuario = normalizeUsuario(body.usuario)
	const password = typeof body.password === 'string' ? body.password : ''

	if (isLocked(usuario)) return void res.status(429).json({ error: 'demasiados_intentos' })

	try {
		const user = (await readUsers()).find((u) => u.usuario === usuario)
		const ok = !!user && (await verifyPassword(password, user.password))
		if (!ok) {
			recordFailure(usuario)
			return void res.status(401).json({ error: 'credenciales_invalidas' })
		}
		clearFailures(usuario)
		res.json({ token: await signToken(usuario), usuario })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

// ---------- Protegidas ----------
adminRouter.use(requireAdmin)

adminRouter.get('/session', (_req, res) => {
	res.json({ usuario: res.locals.usuario })
})

/** Lista de seguimiento: cada establecimiento con su estado y avance real. */
adminRouter.get('/establecimientos', async (_req, res) => {
	try {
		res.json((await cargarFilas()).map(toFilaSeguimiento))
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

adminRouter.get('/establecimientos/:codigo', async (req, res) => {
	const codigo = normalizeCodigo(req.params.codigo)
	if (!codigo) return void res.status(400).json({ error: 'codigo_invalido' })
	try {
		const est = await findEstablecimiento(codigo)
		if (!est) return void res.status(404).json({ error: 'establecimiento_no_encontrado' })
		const detalle: DetalleEstablecimiento = {
			establecimiento: est,
			survey: await readSurvey(codigo),
		}
		res.json(detalle)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

/** Excel con el resumen de un solo establecimiento. */
adminRouter.get('/establecimientos/:codigo/excel', async (req, res) => {
	const codigo = normalizeCodigo(req.params.codigo)
	if (!codigo) return void res.status(400).json({ error: 'codigo_invalido' })
	try {
		const est = await findEstablecimiento(codigo)
		if (!est) return void res.status(404).json({ error: 'establecimiento_no_encontrado' })
		const fila = buildFila(est, await readSurvey(codigo))
		await sendWorkbook(res, buildResumen(fila), `resumen-${codigo}.xlsx`)
	} catch (err) {
		console.error(err)
		if (!res.headersSent) res.status(500).json({ error: 'error_servidor' })
	}
})

/**
 * Excel unificado. `modo`:
 *  - "completadas": solo establecimientos con la encuesta terminada
 *  - "todas": todos, incluidos los vacíos
 * `codigos` (opcional) limita la descarga a lo que muestra el buscador.
 */
adminRouter.post('/exportar', async (req, res) => {
	const body = (req.body ?? {}) as Record<string, unknown>
	const modo = body.modo === 'completadas' ? 'completadas' : body.modo === 'todas' ? 'todas' : null
	if (!modo) return void res.status(400).json({ error: 'modo_invalido' })

	let codigos: string[] | undefined
	if (body.codigos !== undefined) {
		if (!Array.isArray(body.codigos) || body.codigos.length > 5000) {
			return void res.status(400).json({ error: 'cuerpo_invalido' })
		}
		codigos = body.codigos.map(normalizeCodigo).filter((c): c is string => c !== null)
	}

	try {
		let filas = await cargarFilas(codigos)
		if (modo === 'completadas') filas = filas.filter((f) => f.progreso.estado === 'completada')
		if (filas.length === 0) return void res.status(404).json({ error: 'sin_datos' })
		await sendWorkbook(res, buildUnificado(filas), `encuesta-${modo}-${today()}.xlsx`)
	} catch (err) {
		console.error(err)
		if (!res.headersSent) res.status(500).json({ error: 'error_servidor' })
	}
})
