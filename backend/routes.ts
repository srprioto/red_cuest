import { Router } from 'express'
import { describeProgress } from '../src/survey/progreso'
import type { Metadata, SurveyFile } from '../src/types'
import {
	enqueue,
	findEstablecimiento,
	normalizeCodigo,
	readSurvey,
	setEstado,
	writeSurvey,
	type Establecimiento,
} from './storage.js'

export const router = Router()

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v)

/** Agrega los datos del establecimiento para mostrarlos en la encuesta. */
const withEstablecimiento = (survey: SurveyFile, est: Establecimiento): SurveyFile => ({
	...survey,
	establecimiento: est,
})

/**
 * Pseudo-login: valida el código IPRESS contra establecimientos.json y devuelve
 * la encuesta de ese establecimiento. Si no existe todavía, la crea. Si ya existe,
 * la devuelve para continuar o editar.
 */
router.post('/auth', async (req, res) => {
	const body = (req.body ?? {}) as Record<string, unknown>
	const codigo = normalizeCodigo(body.codigo)
	// "nombre" es el jefe del establecimiento
	const nombre = typeof body.nombre === 'string' ? body.nombre.trim().replace(/\s+/g, ' ') : ''

	if (!codigo) return void res.status(400).json({ error: 'codigo_invalido' })
	if (nombre.length < 3 || nombre.length > 120) {
		return void res.status(400).json({ error: 'nombre_invalido' })
	}

	try {
		const result = await enqueue(async () => {
			const est = await findEstablecimiento(codigo)
			if (!est) return null

			const now = new Date().toISOString()
			let survey = await readSurvey(codigo)
			const nuevo = !survey

			if (!survey) {
				survey = {
					ipress: codigo,
					encargado: nombre,
					creadoEn: now,
					actualizadoEn: now,
					metadata: { started: true, startedAt: now },
					answers: {},
				}
				await writeSurvey(codigo, survey)
				await setEstado(codigo, 'en_curso')
			} else if (survey.encargado !== nombre) {
				survey.encargado = nombre
				survey.actualizadoEn = now
				await writeSurvey(codigo, survey)
			}
			return { survey: withEstablecimiento(survey, est), nuevo }
		})

		if (!result) return void res.status(404).json({ error: 'codigo_no_registrado' })
		res.json(result)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

/** Recupera la encuesta (para retomar la sesión al recargar la página). */
router.get('/encuesta/:codigo', async (req, res) => {
	const codigo = normalizeCodigo(req.params.codigo)
	if (!codigo) return void res.status(400).json({ error: 'codigo_invalido' })
	try {
		const [survey, est] = await Promise.all([readSurvey(codigo), findEstablecimiento(codigo)])
		if (!survey || !est) return void res.status(404).json({ error: 'encuesta_no_encontrada' })
		res.json(withEstablecimiento(survey, est))
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})

/** Guarda respuestas y progreso. Se llama en cada "Siguiente". */
router.put('/encuesta/:codigo', async (req, res) => {
	const codigo = normalizeCodigo(req.params.codigo)
	if (!codigo) return void res.status(400).json({ error: 'codigo_invalido' })

	const { answers, metadata } = (req.body ?? {}) as Record<string, unknown>
	if (!isObject(answers) || !isObject(metadata)) {
		return void res.status(400).json({ error: 'cuerpo_invalido' })
	}

	try {
		const found = await enqueue(async () => {
			const survey = await readSurvey(codigo)
			if (!survey) return false
			const updated: SurveyFile = {
				...survey,
				answers: answers as SurveyFile['answers'],
				metadata: metadata as Partial<Metadata>,
				actualizadoEn: new Date().toISOString(),
			}
			await writeSurvey(codigo, updated)
			await setEstado(codigo, describeProgress(updated.metadata, true).estado)
			return true
		})
		if (!found) return void res.status(404).json({ error: 'encuesta_no_encontrada' })
		res.json({ ok: true })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'error_servidor' })
	}
})
