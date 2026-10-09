import type { Block } from '../types'
import { OPERADORES, cantidad, hayInternet, siNo } from './fields'

/** Atajo: "Actual: X" apuntando a la respuesta de la Parte 1. */
const actual = (block: string, field: string) => ({ ref: { block, field } })

/**
 * PARTE 2: Cantidad faltante de equipos informáticos por áreas.
 * Los ids llevan prefijo "faltante_" para no chocar con los de la Parte 1.
 */
export const FALTANTE_BLOCKS: Block[] = [
	{
		id: 'faltante_oficinas',
		phase: 'faltante',
		title: 'Oficinas administrativas',
		subtitle: 'Estadística, SIS, etc. Indica cuántos equipos FALTAN en esta área.',
		fields: [
			cantidad('pc', 'PC (CPU + monitor)', actual('oficinas', 'pc')),
			cantidad('impresora', 'Impresora', actual('oficinas', 'impresora')),
			cantidad('tablet', 'Tablet', actual('oficinas', 'tablet')),
			cantidad('lector_huellas', 'Lector de huellas dactilares', actual('oficinas', 'lector_huellas')),
		],
	},
	{
		id: 'faltante_asistencial',
		phase: 'faltante',
		title: 'Área asistencial',
		subtitle:
			'Farmacia, consultorios, triaje, admisión, PCT, etc. Indica cuántos equipos FALTAN en esta área.',
		fields: [
			cantidad('pc', 'PC (CPU + monitor)', actual('asistencial', 'pc')),
			cantidad('laptop', 'Laptop', actual('asistencial', 'laptop')),
			cantidad('impresoras', 'Impresoras', actual('asistencial', 'impresoras')),
			cantidad('lector_dnie', 'Lector de DNIe', actual('asistencial', 'lector_dnie')),
			cantidad('tablet', 'Tablet', actual('asistencial', 'tablet')),
		],
	},
	{
		id: 'faltante_recepcion',
		phase: 'faltante',
		title: 'Recepción',
		subtitle: 'Indica cuántos equipos de atención y orientación al usuario FALTAN.',
		fields: [
			cantidad('tv', 'TV', actual('recepcion', 'tv')),
			cantidad('totem', 'Tótem (quiosco interactivo)', actual('recepcion', 'totem')),
		],
	},
	{
		id: 'faltante_red',
		phase: 'faltante',
		title: 'Acceso a red',
		subtitle: 'Indica qué cableado y equipos de conectividad se requieren.',
		fields: [
			siNo('cableado_cat6', '¿Requiere cableado CAT 6?', {
				section: 'Cableado',
				...actual('red', 'cableado_cat6'),
			}),
			siNo('cableado_cat5', '¿Requiere cableado CAT 5?', {
				section: 'Cableado',
				...actual('red', 'cableado_cat5'),
			}),
			cantidad('puntos_red', 'Puntos de red que faltan', {
				section: 'Cableado',
				...actual('red', 'puntos_red'),
			}),
			siNo('switch', '¿Requiere switch?', { section: 'Equipos de conectividad' }),
		],
	},
	{
		id: 'faltante_internet',
		phase: 'faltante',
		title: 'Internet',
		subtitle: 'Indica qué servicio de internet se requiere.',
		fields: [
			cantidad('ancho_banda', 'Ancho de banda faltante', {
				unit: 'MB',
				decimal: true,
				hint: 'Si no falta ancho de banda, ingresa 0.',
				...actual('internet', 'ancho_banda'),
			}),
			{
				id: 'operador',
				label: 'Operador requerido',
				type: 'select',
				options: OPERADORES,
				showIf: hayInternet,
				...actual('internet', 'operador'),
			},
			siNo('fibra', '¿Requiere fibra?', {
				section: 'Medio de conexión',
				showIf: hayInternet,
				...actual('internet', 'fibra'),
			}),
			siNo('satelital', '¿Requiere conexión satelital?', {
				section: 'Medio de conexión',
				showIf: hayInternet,
				...actual('internet', 'satelital'),
			}),
			siNo('cobre', '¿Requiere conexión por cobre?', {
				section: 'Medio de conexión',
				showIf: hayInternet,
				...actual('internet', 'cobre'),
			}),
		],
	},
	{
		id: 'faltante_servidores',
		phase: 'faltante',
		title: 'Servidores y almacenamiento',
		subtitle: 'Indica qué servidores se requieren y con qué capacidad.',
		fields: [],
		repeat: {
			gate: siNo('requiere_servidores', '¿El establecimiento requiere servidores?', {
				yesLabel: 'Sí requiere servidores',
				noLabel: 'No requiere servidores',
			}),
			itemTitle: 'Servidor',
			addLabel: 'Agregar otro servidor',
			fields: [
				{ id: 'marca', label: 'Marca deseada', type: 'text', allowNA: true, section: 'Equipo' },
				{ id: 'modelo', label: 'Modelo deseado', type: 'text', allowNA: true, section: 'Equipo' },
				cantidad('cores_total', 'Capacidad requerida', {
					unit: '%',
					max: 100,
					decimal: true,
					section: 'Núcleos (cores)',
				}),
				cantidad('ram_total', 'Capacidad requerida', {
					unit: 'GB',
					decimal: true,
					section: 'Memoria RAM',
				}),
				cantidad('almacenamiento_total', 'Capacidad requerida', {
					unit: 'TB',
					decimal: true,
					section: 'Almacenamiento',
				}),
			],
		},
	},
]
