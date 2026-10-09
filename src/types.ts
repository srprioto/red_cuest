export type Scalar = number | string | null
/** Un registro: { idCampo: valor } */
export type Item = Record<string, Scalar>

export type FieldType = 'number' | 'text' | 'toggle' | 'select' | 'ip' | 'mask'

export interface Field {
  id: string
  label: string
  type: FieldType
  /** Agrupa campos bajo un subtítulo dentro del bloque. */
  section?: string
  hint?: string
  helpLink?: { label: string; href: string }
  unit?: string
  placeholder?: string
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
  title: string
  subtitle?: string
  fields: Field[]
  repeat?: RepeatConfig
  /** Reglas que dependen de respuestas de otros bloques. */
  crossValidate?: (values: Item, all: Answers) => Errors
}

export interface Metadata {
  respondentId: string
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

export interface SurveyPayload {
  answers: Answers
  metadata: Metadata
}
