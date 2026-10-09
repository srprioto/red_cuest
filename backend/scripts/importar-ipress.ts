/**
 * Importa códigos IPRESS desde un .txt o .csv (uno por línea) a backend/data/ipress.json.
 * Conserva el estado de los códigos que ya estaban y no duplica.
 *
 * Uso:  pnpm ipress:importar ruta/al/archivo.txt
 */
import { promises as fs } from 'node:fs'
import { normalizeCodigo, readIpressList, writeIpressList, type IpressEntry } from '../storage.js'

async function main() {
	const file = process.argv[2]
	if (!file) {
		console.error('Indica el archivo. Ejemplo: pnpm ipress:importar codigos.txt')
		process.exit(1)
	}

	const raw = await fs.readFile(file, 'utf-8')
	const list = await readIpressList()
	const known = new Set(list.map((e) => e.codigo))

	let nuevos = 0
	let repetidos = 0
	const ignoradas: string[] = []

	for (const line of raw.split(/\r?\n/)) {
		const first = line.split(/[;,\t]/)[0]?.trim()
		if (!first) continue
		const codigo = normalizeCodigo(first)
		if (!codigo) {
			ignoradas.push(first) // encabezados u otros textos
			continue
		}
		if (known.has(codigo)) {
			repetidos++
			continue
		}
		const entry: IpressEntry = { codigo, estado: 'pendiente' }
		list.push(entry)
		known.add(codigo)
		nuevos++
	}

	await writeIpressList(list)
	console.log(`Nuevos: ${nuevos} | Ya existían: ${repetidos} | Líneas ignoradas: ${ignoradas.length}`)
	console.log(`Total de códigos en ipress.json: ${list.length}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
