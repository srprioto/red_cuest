/**
 * Generación de Excel (exceljs).
 *
 * - buildUnificado: hojas tabulares con el formato de los Excel originales
 *   (título, bloques agrupados, una fila por establecimiento). Sí/No como 0/1
 *   y "No aplica" como "-". Los servidores van en hojas aparte (varios por establecimiento).
 * - buildResumen: resumen legible de un solo establecimiento.
 */
import ExcelJS from 'exceljs'
import { ESTADO_TEXTO } from '../src/admin/types'
import { NA_VALUE } from '../src/config'
import { formatValue } from '../src/lib/format'
import { isVisible } from '../src/lib/validation'
import { BLOCKS, PHASES, PHASE_ORDER } from '../src/survey'
import { buildComparison } from '../src/survey/comparacion'
import { TOTALES_POR_FASE } from '../src/survey/totales'
import type { Block, Field, Phase, Scalar } from '../src/types'
import type { Fila } from './seguimiento.js'

type Value = string | number | Date | null

const NAVY = 'FF182333'
const GREEN = 'FF27AE7A'
const ORANGE = 'FFFDA12B'
const LIGHT = 'FFE9EDF3'
const LINE = 'FFC9D0DB'
const WHITE = 'FFFFFFFF'

const PHASE_COLOR: Record<Phase, string> = { actual: GREEN, faltante: ORANGE }
const DATE_FORMAT = 'dd/mm/yyyy hh:mm'

const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const border: Partial<ExcelJS.Borders> = {
	top: { style: 'thin', color: { argb: LINE } },
	left: { style: 'thin', color: { argb: LINE } },
	bottom: { style: 'thin', color: { argb: LINE } },
	right: { style: 'thin', color: { argb: LINE } },
}

/** Valor de una respuesta tal como va en el Excel tabular (compatible con los originales). */
function cell(f: Field, v: Scalar | undefined): string | number | null {
	if (v === null || v === undefined || v === '') return null
	if (typeof v === 'number') return v
	if (v === NA_VALUE) return '-'
	return f.type === 'select' ? v.toUpperCase() : v
}

const toDate = (iso: string | null | undefined) => (iso ? new Date(iso) : null)

// ==========================================================================
// Hojas tabulares
// ==========================================================================

interface Col {
	group: string
	header: string
	width?: number
	value: (fila: Fila) => Value
}

const IDENT: Col[] = [
	{ group: 'ESTABLECIMIENTO', header: 'Código IPRESS', width: 14, value: (f) => f.est.codigo },
	{ group: 'ESTABLECIMIENTO', header: 'Establecimiento', width: 34, value: (f) => f.est.nombre },
]

const withUnit = (f: Field) => (f.unit ? `${f.label} (${f.unit})` : f.label)

const answerOf = (fila: Fila, blockId: string, fieldId: string) =>
	fila.survey?.answers[blockId]?.values[fieldId]

const fieldCols = (block: Block, group: string): Col[] =>
	block.fields.map((f) => ({
		group,
		header: withUnit(f),
		value: (fila) => cell(f, answerOf(fila, block.id, f.id)),
	}))

/** Bloques que van en la hoja de su parte (sin los que tienen hoja propia). */
const SHEET_EXCLUDED = new Set(['siga', 'datos'])
const tableBlocks = (phase: Phase) =>
	BLOCKS.filter((b) => b.phase === phase && !b.repeat && !SHEET_EXCLUDED.has(b.id))

function totalCols(phase: Phase): Col[] {
	const group = phase === 'actual' ? 'Totales actuales' : 'Totales brecha'
	return TOTALES_POR_FASE[phase]({}).map((t) => ({
		group,
		header: t.label,
		value: (fila) =>
			fila.progreso.finished && fila.survey
				? (TOTALES_POR_FASE[phase](fila.survey.answers).find((x) => x.id === t.id)?.value ?? null)
				: null,
	}))
}

function writeTable(
	wb: ExcelJS.Workbook,
	name: string,
	title: string,
	color: string,
	cols: Col[],
	data: Value[][],
) {
	const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }] })
	const n = cols.length
	const groupText = color === NAVY ? WHITE : NAVY

	// Fila 1: título
	ws.mergeCells(1, 1, 1, n)
	const titleCell = ws.getCell(1, 1)
	titleCell.value = title.toUpperCase()
	titleCell.font = { bold: true, size: 14, color: { argb: WHITE } }
	titleCell.fill = fill(NAVY)
	titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
	ws.getRow(1).height = 30

	// Fila 2: grupos (bloques), combinando las columnas contiguas del mismo grupo
	for (let start = 0; start < n; ) {
		let end = start
		while (end + 1 < n && cols[end + 1].group === cols[start].group) end++
		ws.getCell(2, start + 1).value = cols[start].group.toUpperCase()
		if (end > start) ws.mergeCells(2, start + 1, 2, end + 1)
		start = end + 1
	}
	for (let c = 1; c <= n; c++) {
		const g = ws.getCell(2, c)
		g.font = { bold: true, color: { argb: groupText } }
		g.fill = fill(color)
		g.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
		g.border = border
	}
	ws.getRow(2).height = 24

	// Fila 3: preguntas
	cols.forEach((col, i) => {
		const h = ws.getCell(3, i + 1)
		h.value = col.header.toUpperCase()
		h.font = { bold: true, size: 10, color: { argb: NAVY } }
		h.fill = fill(LIGHT)
		h.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
		h.border = border
		ws.getColumn(i + 1).width =
			col.width ?? Math.min(26, Math.max(12, Math.round(col.header.length * 0.75)))
	})
	ws.getRow(3).height = 58

	// Datos
	data.forEach((values, r) => {
		const row = ws.getRow(4 + r)
		values.forEach((v, c) => {
			const x = row.getCell(c + 1)
			x.value = v
			x.border = border
			x.alignment = {
				vertical: 'middle',
				horizontal: typeof v === 'string' && v.length > 14 ? 'left' : 'center',
				wrapText: true,
			}
			if (v instanceof Date) x.numFmt = DATE_FORMAT
		})
	})

	ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: n } }
}

/** Hoja con una fila por establecimiento. */
function writeFilaSheet(
	wb: ExcelJS.Workbook,
	name: string,
	title: string,
	color: string,
	cols: Col[],
	filas: Fila[],
) {
	writeTable(wb, name, title, color, cols, filas.map((f) => cols.map((c) => c.value(f))))
}

/** Hoja de servidores: una fila por servidor (o una fila vacía si no hay). */
function writeServersSheet(wb: ExcelJS.Workbook, phase: Phase, filas: Fila[]) {
	const block = BLOCKS.find((b) => b.phase === phase && b.repeat)
	const repeat = block?.repeat
	if (!block || !repeat) return

	const group = 'Servidores'
	const cols: Col[] = [
		...IDENT,
		{ group, header: repeat.gate.label, width: 22, value: () => null },
		{ group, header: 'N° de servidor', width: 12, value: () => null },
		...repeat.fields.map((f) => ({
			group,
			header: f.section ? `${f.section}: ${withUnit(f)}` : withUnit(f),
			value: () => null,
		})),
	]

	const data: Value[][] = []
	for (const fila of filas) {
		const ident: Value[] = [fila.est.codigo, fila.est.nombre]
		const answer = fila.survey?.answers[block.id]
		const gate = cell(repeat.gate, answer?.values[repeat.gate.id])
		const items = answer?.items ?? []
		if (items.length === 0) {
			data.push([...ident, gate, null, ...repeat.fields.map(() => null)])
		} else {
			items.forEach((item, i) =>
				data.push([...ident, gate, i + 1, ...repeat.fields.map((f) => cell(f, item[f.id]))]),
			)
		}
	}

	const sheetName = phase === 'actual' ? 'Servidores actuales' : 'Servidores faltantes'
	writeTable(wb, sheetName, `${PHASES[phase].title} · servidores`, PHASE_COLOR[phase], cols, data)
}

export function buildUnificado(filas: Fila[]): ExcelJS.Workbook {
	const wb = new ExcelJS.Workbook()
	wb.creator = 'Encuesta GERESA Cusco'
	wb.created = new Date()

	// 1. Establecimientos: identificación, avance, SIGA y datos de contacto
	const siga = BLOCKS.find((b) => b.id === 'siga')
	const datos = BLOCKS.find((b) => b.id === 'datos')
	const info: Col[] = [
		{ group: 'Establecimiento', header: 'Código IPRESS', width: 14, value: (f) => f.est.codigo },
		{ group: 'Establecimiento', header: 'Establecimiento', width: 34, value: (f) => f.est.nombre },
		{ group: 'Establecimiento', header: 'Provincia', width: 16, value: (f) => f.est.provincia },
		{ group: 'Establecimiento', header: 'Distrito', width: 18, value: (f) => f.est.distrito },
		{ group: 'Establecimiento', header: 'Microred', width: 18, value: (f) => f.est.microred },
		{ group: 'Establecimiento', header: 'Red', width: 24, value: (f) => f.est.red },
		{ group: 'Avance de la encuesta', header: 'Estado', width: 14, value: (f) => ESTADO_TEXTO[f.progreso.estado].toUpperCase() },
		{ group: 'Avance de la encuesta', header: 'Bloques completados', width: 12, value: (f) => f.progreso.completados },
		{ group: 'Avance de la encuesta', header: 'Total de bloques', width: 12, value: (f) => f.progreso.total },
		{ group: 'Avance de la encuesta', header: 'Bloque en el que quedó', width: 30, value: (f) => f.progreso.actual },
		{ group: 'Avance de la encuesta', header: 'Encargado', width: 28, value: (f) => f.survey?.encargado ?? null },
		{ group: 'Avance de la encuesta', header: 'Fecha de inicio', width: 18, value: (f) => toDate(f.survey?.creadoEn) },
		{ group: 'Avance de la encuesta', header: 'Última actividad', width: 18, value: (f) => toDate(f.survey?.actualizadoEn) },
		{
			group: 'Avance de la encuesta',
			header: 'Fecha de finalización',
			width: 18,
			value: (f) => (f.progreso.finished ? toDate(f.survey?.metadata.finishedAt) : null),
		},
		...(siga ? fieldCols(siga, siga.title) : []),
		...(datos ? fieldCols(datos, datos.title) : []),
	]
	writeFilaSheet(wb, 'Establecimientos', 'Establecimientos, avance y datos de contacto', NAVY, info, filas)

	// 2 y 3. Una hoja por parte, con los bloques agrupados como en los Excel originales
	for (const phase of PHASE_ORDER) {
		const cols: Col[] = [
			...IDENT,
			...tableBlocks(phase).flatMap((b) => fieldCols(b, b.title)),
			...totalCols(phase),
		]
		const name = phase === 'actual' ? 'Cantidad actual' : 'Cantidad faltante'
		writeFilaSheet(wb, name, PHASES[phase].title, PHASE_COLOR[phase], cols, filas)
	}

	// 4 y 5. Servidores (varios por establecimiento)
	for (const phase of PHASE_ORDER) writeServersSheet(wb, phase, filas)

	return wb
}

// ==========================================================================
// Resumen de un solo establecimiento
// ==========================================================================

export function buildResumen(fila: Fila): ExcelJS.Workbook {
	const wb = new ExcelJS.Workbook()
	wb.creator = 'Encuesta GERESA Cusco'
	wb.created = new Date()
	const { est, survey, progreso } = fila
	const answers = survey?.answers ?? {}

	// ---------- Hoja "Resumen" ----------
	const ws = wb.addWorksheet('Resumen')
	ws.columns = [{ width: 52 }, { width: 40 }, { width: 18 }]
	let r = 1

	const banner = (text: string, color: string, textColor = WHITE) => {
		ws.mergeCells(r, 1, r, 3)
		const c = ws.getCell(r, 1)
		c.value = text.toUpperCase()
		c.font = { bold: true, size: 12, color: { argb: textColor } }
		c.fill = fill(color)
		c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
		ws.getRow(r).height = 24
		r++
	}
	const pair = (label: string, value: Value) => {
		const a = ws.getCell(r, 1)
		a.value = label
		a.font = { bold: true, color: { argb: NAVY } }
		a.fill = fill(LIGHT)
		a.border = border
		const b = ws.getCell(r, 2)
		b.value = value
		b.border = border
		b.alignment = { horizontal: 'left', wrapText: true, vertical: 'top' }
		if (value instanceof Date) b.numFmt = DATE_FORMAT
		r++
		return b
	}
	const gap = () => void r++

	banner(`Resumen de la encuesta · ${est.nombre}`, NAVY)
	gap()

	banner('Establecimiento', NAVY)
	pair('Código IPRESS', est.codigo)
	pair('Establecimiento', est.nombre)
	pair('Provincia', est.provincia)
	pair('Distrito', est.distrito)
	pair('Microred', est.microred)
	pair('Red', est.red)
	gap()

	banner('Estado y avance', NAVY)
	pair('Estado', ESTADO_TEXTO[progreso.estado])
	pair('Bloques completados', `${progreso.completados} de ${progreso.total}`)
	pair('Avance real', null).value = progreso.completados / progreso.total
	ws.getCell(r - 1, 2).numFmt = '0%'
	pair(
		'Bloque en el que quedó',
		progreso.finished ? 'Encuesta completada' : (progreso.actual ?? 'Aún no inicia'),
	)
	const pendientes = progreso.bloques.filter((b) => !b.done)
	pair(
		'Bloques pendientes',
		pendientes.length === 0 ? 'Ninguno' : pendientes.map((b) => `${b.title} (${PHASES[b.phase].label})`).join('\n'),
	)
	pair('Encargado', survey?.encargado ?? null)
	pair('Fecha de inicio', toDate(survey?.creadoEn))
	pair('Última actividad', toDate(survey?.actualizadoEn))
	pair('Fecha de finalización', progreso.finished ? toDate(survey?.metadata.finishedAt) : null)
	gap()

	// Totales de cada parte (solo cuando la encuesta está completa)
	for (const phase of PHASE_ORDER) {
		banner(`Totales · ${PHASES[phase].title}`, PHASE_COLOR[phase], NAVY)
		if (progreso.finished) {
			for (const t of TOTALES_POR_FASE[phase](answers)) pair(t.label, t.value)
		} else {
			pair('Totales', 'Se calculan al completar la encuesta')
		}
		gap()
	}

	// Comparación por área: Actual | Faltante
	if (survey) {
		banner('Comparación por área', NAVY)
		for (const [i, h] of ['Concepto', 'Actual', 'Faltante'].entries()) {
			const c = ws.getCell(r, i + 1)
			c.value = h
			c.font = { bold: true, color: { argb: NAVY } }
			c.fill = fill(LIGHT)
			c.border = border
			c.alignment = { horizontal: i === 0 ? 'left' : 'center' }
		}
		r++
		for (const group of buildComparison(answers)) {
			ws.mergeCells(r, 1, r, 3)
			const g = ws.getCell(r, 1)
			g.value = group.title
			g.font = { bold: true, color: { argb: NAVY } }
			g.fill = fill('FFF4F6F9')
			r++
			for (const row of group.rows) {
				const concept = ws.getCell(r, 1)
				concept.value = row.unit ? `${row.label} (${row.unit})` : row.label
				concept.border = border
				const a = ws.getCell(r, 2)
				a.value = typeof row.actual === 'number' ? row.actual : null
				const f = ws.getCell(r, 3)
				f.value = typeof row.faltante === 'number' ? row.faltante : null
				for (const x of [a, f]) {
					x.border = border
					x.alignment = { horizontal: 'center' }
				}
				r++
			}
		}
	}

	// ---------- Hoja "Respuestas": todas las respuestas, bloque por bloque ----------
	const wr = wb.addWorksheet('Respuestas', { views: [{ state: 'frozen', ySplit: 1 }] })
	wr.columns = [
		{ header: 'PARTE', width: 44 },
		{ header: 'BLOQUE', width: 30 },
		{ header: 'SECCIÓN', width: 24 },
		{ header: 'PREGUNTA', width: 54 },
		{ header: 'REGISTRO', width: 14 },
		{ header: 'RESPUESTA', width: 32 },
	]
	wr.getRow(1).eachCell((c) => {
		c.font = { bold: true, color: { argb: WHITE } }
		c.fill = fill(NAVY)
		c.alignment = { vertical: 'middle' }
	})
	wr.getRow(1).height = 24

	const addRow = (values: Value[], color?: string) => {
		const row = wr.addRow(values)
		row.eachCell({ includeEmpty: true }, (c) => {
			c.border = border
			c.alignment = { vertical: 'top', wrapText: true }
		})
		if (color) row.getCell(1).fill = fill(color)
	}

	for (const block of BLOCKS) {
		const parte = PHASES[block.phase].title
		const answer = answers[block.id]
		if (!answer) {
			addRow([parte, block.title, null, '(sin responder)', null, null], PHASE_COLOR[block.phase])
			continue
		}
		for (const f of block.fields) {
			if (!isVisible(f, answer.values)) continue
			addRow(
				[parte, block.title, f.section ?? null, f.label, null, formatValue(f, answer.values[f.id])],
				PHASE_COLOR[block.phase],
			)
		}
		if (block.repeat) {
			const { gate, fields, itemTitle } = block.repeat
			addRow([parte, block.title, null, gate.label, null, formatValue(gate, answer.values[gate.id])], PHASE_COLOR[block.phase])
			;(answer.items ?? []).forEach((item, i) => {
				for (const f of fields) {
					if (!isVisible(f, item)) continue
					addRow(
						[parte, block.title, f.section ?? null, f.label, `${itemTitle} ${i + 1}`, formatValue(f, item[f.id])],
						PHASE_COLOR[block.phase],
					)
				}
			})
		}
	}

	return wb
}
