/**
 * Servidor local de la encuesta (puerto 3001).
 * Todo lo del backend vive en esta carpeta: rutas, almacenamiento y datos.
 */
import express, { type ErrorRequestHandler } from 'express'
import { router } from './routes.js'

const PORT = 3001

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use('/api', router)

app.use((_req, res) => {
	res.status(404).json({ error: 'no_encontrado' })
})

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
	console.error(err)
	res.status(400).json({ error: 'solicitud_invalida' })
}
app.use(onError)

app.listen(PORT, '127.0.0.1', () => {
	console.log(`API de la encuesta en http://127.0.0.1:${PORT}`)
})
