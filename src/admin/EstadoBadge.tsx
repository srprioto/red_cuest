import type { Estado } from '../types'
import { ESTADO_TEXTO } from './types'

export default function EstadoBadge({ estado }: { estado: Estado }) {
	return <span className={`badge badge--${estado}`}>{ESTADO_TEXTO[estado]}</span>
}
