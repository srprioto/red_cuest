import { num } from '../lib/utils'
import type { Answers, Phase } from '../types'

export interface Total {
	id: string
	label: string
	value: number
}

/** Totales de la Parte 1. Se calculan, no se preguntan. */
export function totalesActuales(a: Answers): Total[] {
	const adm = a.oficinas?.values ?? {}
	const asi = a.asistencial?.values ?? {}
	const net = a.internet?.values ?? {}
	const conInternet = num(net.ancho_banda) > 0 ? 1 : 0

	return [
		{ id: 'total_pcs', label: 'Total de PCs actuales', value: num(adm.pc) + num(asi.pc) },
		{
			id: 'total_impresoras',
			label: 'Total de impresoras actuales',
			value: num(adm.impresora) + num(asi.impresoras),
		},
		{ id: 'total_laptops', label: 'Total de laptops actuales', value: num(asi.laptop) },
		{
			id: 'total_lectores_dni',
			label: 'Total de lectores de DNIe actuales',
			value: num(asi.lector_dnie),
		},
		{ id: 'eess_con_internet', label: 'EESS con acceso a internet', value: conInternet },
		{ id: 'eess_sin_internet', label: 'EESS sin acceso a internet', value: 1 - conInternet },
	]
}

/** Totales de la Parte 2 ("totales brecha"). */
export function totalesBrecha(a: Answers): Total[] {
	const adm = a.faltante_oficinas?.values ?? {}
	const asi = a.faltante_asistencial?.values ?? {}

	return [
		{ id: 'brecha_pcs', label: 'Total de PCs faltantes', value: num(adm.pc) + num(asi.pc) },
		{
			id: 'brecha_impresoras',
			label: 'Total de impresoras faltantes',
			value: num(adm.impresora) + num(asi.impresoras),
		},
		{ id: 'brecha_laptops', label: 'Total de laptops faltantes', value: num(asi.laptop) },
		{
			id: 'brecha_lectores_dni',
			label: 'Total de lectores de DNIe faltantes',
			value: num(asi.lector_dnie),
		},
	]
}

export const TOTALES_POR_FASE: Record<Phase, (a: Answers) => Total[]> = {
	actual: totalesActuales,
	faltante: totalesBrecha,
}
