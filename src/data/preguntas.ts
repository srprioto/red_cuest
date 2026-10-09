import type { Block, Errors, Field } from '../types'
import { num } from '../lib/utils'

/**
 * Todas las preguntas de la encuesta.
 * Para agregar o cambiar una pregunta solo se edita este archivo.
 * Un bloque = una página.
 */

const cantidad = (id: string, label: string, extra: Partial<Field> = {}): Field => ({
  id,
  label,
  type: 'number',
  ...extra,
})

const siNo = (id: string, label: string, extra: Partial<Field> = {}): Field => ({
  id,
  label,
  type: 'toggle',
  ...extra,
})

const TIPO_CONTRATO = ['Convenio', 'Contrato con EESS', 'Internet social', 'Otros']
const TIPO_INTERNET = ['Internet empresarial', 'Internet hogar']
const OPERADORES = ['Claro', 'Movistar', 'Bitel', 'Entel', 'Otros']
const TENENCIA = ['Propio', 'Alquilado', 'Prestado', 'Donado']
const ESTADOS = ['Operativo en uso', 'Operativo sin uso', 'No operativo']

const hayInternet = (v: Record<string, unknown>) => typeof v.ancho_banda === 'number' && v.ancho_banda > 0

export const BLOCKS: Block[] = [
  {
    id: 'oficinas',
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
    title: 'Características de los equipos',
    subtitle: 'Clasifica los equipos de cómputo según su procesador.',
    fields: [
      cantidad('equipos_menor_i5', 'Equipos con procesador menor a Core i5'),
      cantidad('equipos_mayor_i5', 'Equipos con procesador Core i5 o superior', {
        hint: 'La suma de ambos campos debe coincidir con los PCs y laptops que declaraste antes.',
      }),
    ],
    crossValidate: (v, all): Errors => {
      const declarados =
        num(all.oficinas?.values.pc) + num(all.asistencial?.values.pc) + num(all.asistencial?.values.laptop)
      const suma = num(v.equipos_menor_i5) + num(v.equipos_mayor_i5)
      return suma === declarados
        ? {}
        : {
            equipos_mayor_i5: `La suma de ambos campos es ${suma}, pero declaraste ${declarados} entre PCs y laptops. Deben coincidir.`,
          }
    },
  },
  {
    id: 'recepcion',
    title: 'Recepción',
    subtitle: 'Equipos de atención y orientación al usuario.',
    fields: [cantidad('tv', 'TV'), cantidad('totem', 'Tótem (quiosco interactivo)')],
  },
  {
    id: 'red',
    title: 'Acceso a red',
    subtitle: 'Cableado, equipos de conectividad y direccionamiento interno.',
    fields: [
      siNo('cableado_cat6', 'Cableado CAT 6', { section: 'Cableado' }),
      siNo('cableado_cat5', 'Cableado CAT 5', { section: 'Cableado' }),
      cantidad('puntos_red', 'Puntos de red', { section: 'Cableado' }),
      siNo('switch_administrable', 'Switch administrable', { section: 'Equipos de conectividad' }),
      siNo('switch_no_administrable', 'Switch no administrable', { section: 'Equipos de conectividad' }),
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
      {
        id: 'operador',
        label: 'Operador',
        type: 'select',
        options: OPERADORES,
        showIf: hayInternet,
      },
      siNo('fibra', 'Conexión por fibra', { section: 'Medio de conexión', showIf: hayInternet }),
      siNo('satelital', 'Conexión satelital', { section: 'Medio de conexión', showIf: hayInternet }),
      siNo('cobre', 'Conexión por cobre', { section: 'Medio de conexión', showIf: hayInternet }),
      siNo('seguridad_gestionada', 'Seguridad gestionada', { section: 'Servicios adicionales', showIf: hayInternet }),
      siNo('segundo_carrier', 'Segundo carrier', { section: 'Servicios adicionales', showIf: hayInternet }),
    ],
  },
  {
    id: 'servidores',
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
        cantidad('cores_total', 'Capacidad total', { unit: '%', max: 100, decimal: true, section: 'Núcleos (cores)' }),
        cantidad('cores_uso', 'Uso actual', { unit: '%', max: 100, decimal: true, lteField: 'cores_total', section: 'Núcleos (cores)' }),
        cantidad('ram_total', 'Capacidad total', { unit: 'GB', decimal: true, section: 'Memoria RAM' }),
        cantidad('ram_uso', 'Uso actual', { unit: 'GB', decimal: true, lteField: 'ram_total', section: 'Memoria RAM' }),
        cantidad('almacenamiento_total', 'Capacidad total', { unit: 'TB', decimal: true, section: 'Almacenamiento' }),
        cantidad('almacenamiento_uso', 'Uso actual', { unit: 'TB', decimal: true, lteField: 'almacenamiento_total', section: 'Almacenamiento' }),
        cantidad('antiguedad', 'Años de antigüedad', { unit: 'años', section: 'Estado y tenencia' }),
        { id: 'tenencia', label: 'Régimen de tenencia', type: 'select', options: TENENCIA, section: 'Estado y tenencia' },
        { id: 'estado', label: 'Estado actual', type: 'select', options: ESTADOS, section: 'Estado y tenencia' },
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

export const TOTAL_BLOCKS = BLOCKS.length
