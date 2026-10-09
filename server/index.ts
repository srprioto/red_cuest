/**
 * Servidor local que guarda la encuesta en archivos JSON:
 *   src/data/respuestas.json  -> respuestas por encuestado
 *   src/data/metadata.json    -> progreso por encuestado (bloque actual, completados, fechas)
 */
import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const PORT = 3001
const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const RESPUESTAS_FILE = path.join(DATA_DIR, 'respuestas.json')
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json')

type Store = Record<string, unknown>

async function readStore(file: string): Promise<Store> {
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return raw.trim() ? (JSON.parse(raw) as Store) : {}
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw err
  }
}

const writeStore = (file: string, data: Store) =>
  fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')

// Las escrituras se hacen una a la vez para no corromper los archivos.
let queue: Promise<unknown> = Promise.resolve()
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task)
  queue = run.catch(() => undefined)
  return run
}

const ID_RE = /^[A-Za-z0-9][\w-]{0,63}$/
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/api/survey/:id', async (req, res) => {
  const { id } = req.params
  if (!ID_RE.test(id)) return void res.status(400).json({ error: 'ID inválido' })
  try {
    const [respuestas, metadata] = await Promise.all([
      readStore(RESPUESTAS_FILE),
      readStore(METADATA_FILE),
    ])
    res.json({
      answers: Object.hasOwn(respuestas, id) ? respuestas[id] : {},
      metadata: Object.hasOwn(metadata, id) ? metadata[id] : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'No se pudo leer la encuesta' })
  }
})

app.put('/api/survey/:id', async (req, res) => {
  const { id } = req.params
  if (!ID_RE.test(id)) return void res.status(400).json({ error: 'ID inválido' })
  const { answers, metadata } = (req.body ?? {}) as Record<string, unknown>
  if (!isObject(answers) || !isObject(metadata)) {
    return void res.status(400).json({ error: 'Cuerpo inválido' })
  }
  try {
    await enqueue(async () => {
      const [respuestas, metas] = await Promise.all([
        readStore(RESPUESTAS_FILE),
        readStore(METADATA_FILE),
      ])
      respuestas[id] = answers
      metas[id] = metadata
      await writeStore(RESPUESTAS_FILE, respuestas)
      await writeStore(METADATA_FILE, metas)
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'No se pudo guardar la encuesta' })
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API de la encuesta en http://127.0.0.1:${PORT}`)
})
