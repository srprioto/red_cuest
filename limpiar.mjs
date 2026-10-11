/**
 * Borra los archivos que ya no sirven. Uso (desde la raíz del proyecto):
 *
 *   node limpiar.mjs
 *
 * Al terminar se borra a sí mismo. No toca tus respuestas ni backend/data/encuestas.
 */
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const abs = (rel) => path.join(root, rel)

const OBSOLETOS = [
	// versión anterior del servidor (ahora todo está en backend/)
	'server',
	// preguntas y JSON antiguos (ahora: src/survey y backend/data)
	'src/data',
	// restos de la plantilla de Vite
	'src/assets',
	'src/App.css',
	'src/index.css',
	'public/vite.svg',
	'public/favicon.svg',
	'public/icons.svg',
	// estilos antiguos (ahora todo está en src/styles/app.scss)
	'src/styles/_base.scss',
	'src/styles/_fields.scss',
	'src/styles/_layout.scss',
	'src/styles/_mixins.scss',
	'src/styles/_pages.scss',
	'src/styles/_variables.scss',
	// importador de códigos IPRESS (ahora se edita establecimientos.json)
	'backend/scripts',
]

let borrados = 0
let pendiente = false
for (const rel of OBSOLETOS) {
	if (!existsSync(abs(rel))) continue
	rmSync(abs(rel), { recursive: true, force: true })
	console.log(`  borrado: ${rel}`)
	borrados++
}

// ipress.json lo reemplazó establecimientos.json. Solo se borra si no se pierde ningún código.
const ipressFile = abs('backend/data/ipress.json')
if (existsSync(ipressFile)) {
	const clean = (c) => String(c).trim().replace(/^0+/, '')
	const read = (file) => {
		try {
			return JSON.parse(readFileSync(file, 'utf-8'))
		} catch {
			return []
		}
	}
	const nuevos = new Set(read(abs('backend/data/establecimientos.json')).map((e) => clean(e['CODIGO IPRESS'])))
	const faltan = read(ipressFile)
		.map((e) => e.codigo)
		.filter((c) => !nuevos.has(clean(c)))
	if (faltan.length === 0) {
		rmSync(ipressFile)
		console.log('  borrado: backend/data/ipress.json')
		borrados++
	} else {
		console.log(`\n  AVISO: backend/data/ipress.json NO se borró porque tiene ${faltan.length} código(s)`)
		console.log('  que no están en establecimientos.json:')
		console.log('  ' + faltan.join(', '))
		console.log('  Agrégalos a establecimientos.json y vuelve a ejecutar este script.\n')
		pendiente = true
	}
}

console.log(borrados === 0 ? 'No había nada que borrar.' : `\nListo: ${borrados} elemento(s) borrado(s).`)
if (!pendiente) {
	rmSync(fileURLToPath(import.meta.url))
	console.log('(limpiar.mjs se borró solo)')
}
