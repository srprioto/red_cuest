export type Scalar = number | string | null
/** Un registro: { idCampo: valor } */
export type Item = Record<string, Scalar>

/** Las dos grandes categorías de la encuesta. */
export type Phase = 'actual' | 'faltante'

export type FieldType = 'number' | 'text' | 'toggle' | 'select' | 'ip' | 'mask'

/** Apunta a una respuesta de otro bloque, para mostrarla como referencia. */
export interface FieldRef {
	block: string
	field: string
}

export interface Field {
	id: string
	label: string
	type: FieldType
	/** Agrupa campos bajo un subtítulo dentro del bloque. */
	section?: string
	hint?: string
	/** Hint que depende de las respuestas de otros bloques. */
	dynamicHint?: (all: Answers) => string
	helpLink?: { label: string; href: string }
	unit?: string
	placeholder?: string
	/** Teclado que se abre en el celular (campos de texto). */
	inputMode?: 'text' | 'numeric' | 'decimal'
	maxLength?: number
	/** Solo para type = 'select'. */
	options?: string[]
	/** Muestra la casilla "No aplica" (text, ip, mask). */
	allowNA?: boolean
	/** Solo number. Por defecto 0. */
	min?: number
	max?: number
	/** Solo number. Permite decimales. */
	decimal?: boolean
	/** Solo number. El valor no puede superar al de otro campo del mismo registro. */
	lteField?: string
	/** Solo toggle. Textos de las opciones (por defecto "Sí" / "No"). */
	yesLabel?: string
	noLabel?: string
	/** Si devuelve false el campo se oculta y deja de ser obligatorio. */
	showIf?: (values: Item) => boolean
	/** Muestra "Actual: X" con lo que se respondió en otro bloque. */
	ref?: FieldRef
	/**
	 * Campo calculado: se llena solo, se ve pero no se puede editar.
	 * Devuelve null mientras no haya datos suficientes.
	 */
	computed?: (values: Item, all: Answers) => number | null
}

/** Configuración para bloques con registros repetibles (botón "+"). */
export interface RepeatConfig {
	/** Pregunta Sí/No que habilita los registros. */
	gate: Field
	/** Nombre de cada registro: "Servidor" -> "Servidor 1", "Servidor 2"... */
	itemTitle: string
	addLabel: string
	fields: Field[]
}

export type Errors = Record<string, string>

export interface BlockAnswer {
	values: Item
	items?: Item[]
}
export type Answers = Record<string, BlockAnswer>

export interface Block {
	id: string
	phase: Phase
	title: string
	subtitle?: string
	fields: Field[]
	repeat?: RepeatConfig
	/** Reglas que dependen de respuestas de otros bloques. */
	crossValidate?: (values: Item, all: Answers) => Errors
}

export interface Metadata {
	started: boolean
	finished: boolean
	/** Ids de bloques ya respondidos (con "Siguiente"). */
	completedBlocks: string[]
	/** Índice del bloque más avanzado al que el usuario tiene acceso. */
	currentBlock: number
	/** Último bloque guardado. */
	lastBlock: string | null
	startedAt: string | null
	updatedAt: string | null
	finishedAt: string | null
}

/** Quién está respondiendo (pseudo-login). */
export interface Session {
	ipress: string
	encargado: string
}

/** Contenido de backend/data/encuestas/<codigo>.json */
export interface SurveyFile {
	ipress: string
	encargado: string
	metadata: Partial<Metadata>
	answers: Answers
}

export interface SurveyPayload {
	answers: Answers
	metadata: Metadata
}
