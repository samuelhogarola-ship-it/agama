import type { School, SchoolId } from '../lib/types'

export const SCHOOL_ORDER: SchoolId[] = [
  'servicio',
  'ventas',
  'liderazgo',
  'operaciones',
  'producto',
  'aprendizaje',
  'cultura',
]

export const SCHOOLS: School[] = [
  {
    id: 'servicio',
    name: 'Servicio',
    icon: '🤝',
    description: 'Atención al cliente, empatía y excelencia en el servicio',
  },
  {
    id: 'ventas',
    name: 'Ventas',
    icon: '💰',
    description: 'Comercial, negociación y generación de oportunidades',
  },
  {
    id: 'liderazgo',
    name: 'Liderazgo',
    icon: '🦅',
    description: 'Gestión de equipos, visión y decisiones estratégicas',
  },
  {
    id: 'operaciones',
    name: 'Operaciones',
    icon: '⚙️',
    description: 'Procesos, eficiencia y gestión del día a día',
  },
  {
    id: 'producto',
    name: 'Producto',
    icon: '🎨',
    description: 'Catálogo, características clave y diferenciación',
  },
  {
    id: 'aprendizaje',
    name: 'Aprendizaje',
    icon: '📚',
    description: 'Formación continua y desarrollo profesional',
  },
  {
    id: 'cultura',
    name: 'Cultura',
    icon: '🏛️',
    description: 'Valores, identidad y filosofía AGAMA',
  },
]

export function findSchool(id: string | undefined): School | undefined {
  if (!id) return undefined
  return SCHOOLS.find((s) => s.id === id)
}
