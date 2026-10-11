import { num } from '../lib/utils'
import type { Answers, Block, Errors, Field } from '../types'
import {
	ESTADOS,
	OPERADORES,
	TENENCIA,
	TIPO_CONTRATO,
	TIPO_INTERNET,
	cantidad,
	hayInternet,
	siNo,
} from './fields'

/** Nombre, celular y correo de un funcionario (todos opcionales). */
const contacto = (prefix: string, cargo: string, section: string): Field[] => [
	{ id: `${prefix}_nombre`, label: cargo, type: 'text', optional: true, section },
	{
		id: `${prefix}_celular`,
		label: `Celular ${cargo.charAt(0).toLowerCase()}${cargo.slice(1)}`,
		type: 'text',
		optional: true,
		format: 'celular',
		inputMode: 'tel',
		maxLength: 15,
		placeholder: '987654321',
		section,
	},
	{
		id: `${prefix}_correo`,
		label: `Correo ${cargo.charAt(0).toLowerCase()}${cargo.slice(1)}`,
		type: 'text',
		optional: true,
		format: 'email',
		inputMode: 'email',
		placeholder: 'nombre@correo.com',
		section,
	},
]

/** Total de PCs y laptops declarados en Oficinas y Asistencial. */
const totalEquipos = (all: Answers) =>
	num(all.oficinas?.values.pc) + num(all.asistencial?.values.pc) + num(all.asistencial?.values.laptop)

/** PARTE 1: Cantidad actual de equipos informáticos por áreas. */
export const ACTUAL_BLOCKS: Block[] = [
	{
		id: 'siga',
		phase: 'actual',
		title: 'Registro en SIGA Patrimonial',
		subtitle: 'Antes de comenzar, confirma el origen de la información que vas a declarar.',
		fields: [
			siNo(
				'siga_patrimonial',
				'¿La información que va a declarar está registrada en el SIGA Patrimonial?',
			),
		],
	},
	{
		id: 'datos',
		phase: 'actual',
		title: 'Actualización de datos',
		subtitle: 'Actualiza los datos de contacto del establecimiento. Todos los campos son opcionales.',
		fields: [
			siNo('ris', 'RIS', { optional: true, section: 'Establecimiento' }),
			{
				id: 'telefonos',
				label: 'Teléfonos',
				type: 'text',
				optional: true,
				inputMode: 'tel',
				placeholder: '084 123456',
				hint: 'Si hay más de uno, sepáralos con coma.',
				section: 'Establecimiento',
			},
			...contacto('director', 'Funcionario (Director) de EESS', 'Director del establecimiento'),
			...contacto(
				'ti',
				'Funcionario responsable de informática o TI',
				'Responsable de informática o TI',
			),
		],
	},
	{
		id: 'oficinas',
		phase: 'actual',
		title: 'Oficinas administrativas',
		subtitle: 'Estadística, SIS, etc. Indica la cantidad actual de equipos en esta área.',
		fields: [
			cantidad('pc', 'PC (CPU + monitor)'),
			cantidad('impresora', 'Impresora'),
			cantidad('tablet', 'Tablet'),
			cantidad('lector_huellas', 'Lector de huellas dactilares'),
		],
	},
	{
		id: 'asistencial',
		phase: 'actual',
		title: 'Área asistencial',
		subtitle:
			'Farmacia, consultorios, triaje, admisión, PCT, etc. Indica la cantidad actual de equipos en esta área.',
		fields: [
			cantidad('pc', 'PC (CPU + monitor)'),
			cantidad('laptop', 'Laptop'),
			cantidad('impresoras', 'Impresoras'),
			cantidad('lector_dnie', 'Lector de DNIe'),
			cantidad('tablet', 'Tablet'),
		],
	},
	{
		id: 'caracteristicas',
		phase: 'actual',
		title: 'Características de los equipos',
		subtitle: 'Clasifica los equipos de cómputo según su procesador.',
		fields: [
			cantidad('equipos_menor_i5', 'Equipos con procesador menor a Core i5', {
				dynamicHint: (all) => `Entre PCs y laptops declaraste ${totalEquipos(all)} equipos en total.`,
			}),
			cantidad('equipos_mayor_i5', 'Equipos con procesador Core i5 o superior', {
				hint: 'Se calcula automáticamente: total de equipos menos los de procesador menor a Core i5.',
				computed: (v, all) => {
					if (typeof v.equipos_menor_i5 !== 'number') return null
					const resto = totalEquipos(all) - v.equipos_menor_i5
					return resto >= 0 ? resto : null
				},
			}),
		],
		crossValidate: (v, all): Errors => {
			// Si el campo editable está vacío, ya lo marca como obligatorio
			if (typeof v.equipos_menor_i5 !== 'number') return {}
			const total = totalEquipos(all)
			if (v.equipos_menor_i5 > total) {
				return {
					equipos_menor_i5: `No puede ser mayor que el total de PCs y laptops que declaraste (${total}).`,
				}
			}
			// Si se editaron Oficinas o Asistencial después, el valor guardado quedó desfasado
			if (num(v.equipos_menor_i5) + num(v.equipos_mayor_i5) !== total) {
				return {
					equipos_mayor_i5: `El total de equipos cambió (ahora son ${total}). Guarda este bloque otra vez para recalcularlo.`,
				}
			}
			return {}
		},
	},
	{
		id: 'recepcion',
		phase: 'actual',
		title: 'Recepción',
		subtitle: 'Equipos de atención y orientación al usuario.',
		fields: [cantidad('tv', 'TV'), cantidad('totem', 'Tótem (quiosco interactivo)')],
	},
	{
		id: 'red',
		phase: 'actual',
		title: 'Acceso a red',
		subtitle: 'Cableado, equipos de conectividad y direccionamiento interno.',
		fields: [
			siNo('cableado_cat6', 'Cableado CAT 6', { section: 'Cableado' }),
			siNo('cableado_cat5', 'Cableado CAT 5', { section: 'Cableado' }),
			cantidad('puntos_red', 'Puntos de red', { section: 'Cableado' }),
			siNo('switch_administrable', 'Switch administrable', { section: 'Equipos de conectividad' }),
			siNo('switch_no_administrable', 'Switch no administrable', {
				section: 'Equipos de conectividad',
			}),
			{
				id: 'ip_red_interna',
				label: 'IP de la red interna general',
				type: 'ip',
				allowNA: true,
				placeholder: '192.168.1.0',
				section: 'Direccionamiento interno',
			},
			{
				id: 'mascara_red_interna',
				label: 'Máscara de la red interna',
				type: 'mask',
				allowNA: true,
				placeholder: '255.255.255.0',
				section: 'Direccionamiento interno',
			},
		],
	},
	{
		id: 'internet',
		phase: 'actual',
		title: 'Internet',
		subtitle: 'Datos del servicio de internet del establecimiento.',
		fields: [
			cantidad('ancho_banda', 'Ancho de banda', {
				unit: 'MB',
				decimal: true,
				hint: 'Si el establecimiento no tiene internet, ingresa 0.',
			}),
			{
				id: 'ip_publica',
				label: 'IP pública',
				type: 'ip',
				allowNA: true,
				placeholder: '200.10.20.30',
				hint: 'Puedes consultarla en',
				helpLink: { label: 'cual-es-mi-ip.net', href: 'https://www.cual-es-mi-ip.net/' },
				showIf: hayInternet,
			},
			{
				id: 'tipo_contrato',
				label: 'Tipo de contrato',
				type: 'select',
				options: TIPO_CONTRATO,
				showIf: hayInternet,
			},
			{
				id: 'tipo_internet',
				label: 'Tipo de servicio',
				type: 'select',
				options: TIPO_INTERNET,
				showIf: hayInternet,
			},
			{ id: 'operador', label: 'Operador', type: 'select', options: OPERADORES, showIf: hayInternet },
			siNo('fibra', 'Conexión por fibra', { section: 'Medio de conexión', showIf: hayInternet }),
			siNo('satelital', 'Conexión satelital', { section: 'Medio de conexión', showIf: hayInternet }),
			siNo('cobre', 'Conexión por cobre', { section: 'Medio de conexión', showIf: hayInternet }),
			siNo('seguridad_gestionada', 'Seguridad gestionada', {
				section: 'Servicios adicionales',
				showIf: hayInternet,
			}),
			siNo('segundo_carrier', 'Segundo carrier', {
				section: 'Servicios adicionales',
				showIf: hayInternet,
			}),
		],
	},
	{
		id: 'servidores',
		phase: 'actual',
		title: 'Servidores y almacenamiento',
		subtitle: 'Equipamiento de servidores del establecimiento.',
		fields: [],
		repeat: {
			gate: siNo('tiene_servidores', '¿El establecimiento cuenta con servidores?', {
				yesLabel: 'Sí cuenta con servidores',
				noLabel: 'No cuenta con servidores',
			}),
			itemTitle: 'Servidor',
			addLabel: 'Agregar otro servidor',
			fields: [
				{ id: 'marca', label: 'Marca', type: 'text', allowNA: true, section: 'Equipo' },
				{ id: 'modelo', label: 'Modelo', type: 'text', allowNA: true, section: 'Equipo' },
				cantidad('cores_total', 'Capacidad total', {
					unit: '%',
					max: 100,
					decimal: true,
					section: 'Núcleos (cores)',
				}),
				cantidad('cores_uso', 'Uso actual', {
					unit: '%',
					max: 100,
					decimal: true,
					lteField: 'cores_total',
					section: 'Núcleos (cores)',
				}),
				cantidad('ram_total', 'Capacidad total', {
					unit: 'GB',
					decimal: true,
					section: 'Memoria RAM',
				}),
				cantidad('ram_uso', 'Uso actual', {
					unit: 'GB',
					decimal: true,
					lteField: 'ram_total',
					section: 'Memoria RAM',
				}),
				cantidad('almacenamiento_total', 'Capacidad total', {
					unit: 'TB',
					decimal: true,
					section: 'Almacenamiento',
				}),
				cantidad('almacenamiento_uso', 'Uso actual', {
					unit: 'TB',
					decimal: true,
					lteField: 'almacenamiento_total',
					section: 'Almacenamiento',
				}),
				cantidad('antiguedad', 'Años de antigüedad', { unit: 'años', section: 'Estado y tenencia' }),
				{
					id: 'tenencia',
					label: 'Régimen de tenencia',
					type: 'select',
					options: TENENCIA,
					section: 'Estado y tenencia',
				},
				{
					id: 'estado',
					label: 'Estado actual',
					type: 'select',
					options: ESTADOS,
					section: 'Estado y tenencia',
				},
				{
					id: 'sistema',
					label: 'Sistema de información que soporta',
					type: 'text',
					allowNA: true,
					hint: 'Servidor de aplicaciones.',
					section: 'Estado y tenencia',
				},
			],
		},
	},
]
