import type { Answers } from '../types'
import { num } from '../lib/utils'

export interface Total {
  id: string
  label: string
  value: number
}

/** Bloque "Totales actuales" del Excel: se calcula, no se pregunta. */
export function computeTotales(a: Answers): Total[] {
  const adm = a.oficinas?.values ?? {}
  const asi = a.asistencial?.values ?? {}
  const net = a.internet?.values ?? {}
  const conInternet = num(net.ancho_banda) > 0 ? 1 : 0

  return [
    { id: 'total_pcs', label: 'Total de PCs actuales', value: num(adm.pc) + num(asi.pc) },
    { id: 'total_impresoras', label: 'Total de impresoras actuales', value: num(adm.impresora) + num(asi.impresoras) },
    { id: 'total_laptops', label: 'Total de laptops actuales', value: num(asi.laptop) },
    { id: 'total_lectores_dni', label: 'Total de lectores de DNIe actuales', value: num(asi.lector_dnie) },
    { id: 'eess_con_internet', label: 'EESS con acceso a internet', value: conInternet },
    { id: 'eess_sin_internet', label: 'EESS sin acceso a internet', value: 1 - conInternet },
  ]
}
