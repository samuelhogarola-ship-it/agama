export type ItemType = 'capitulo' | 'guia' | 'evaluacion'

export type SchoolId =
  | 'servicio'
  | 'ventas'
  | 'liderazgo'
  | 'operaciones'
  | 'producto'
  | 'aprendizaje'
  | 'cultura'

export type FraseCategory = SchoolId | 'general' | 'integridad'

export type Level = 'recluta' | 'especialista'

export interface ChapterBody {
  objetivo: string
  contenido: string[]
  ideaPrincipal: string
  relacionados: string[]
  fraseFundacional: string
}

export interface ContentItem {
  slug: string
  code: string | null
  title: string
  type: ItemType
  school: SchoolId
  level: Level
  durationMin: number
  summary: string
  body?: ChapterBody
}

export interface School {
  id: SchoolId
  name: string
  icon: string
  description: string
}

export interface Frase {
  code: string
  text: string | null
  category: FraseCategory
  level: Level
}

export type ProgressMap = Record<string, string>

export interface AcademyUser {
  id: string
  email: string
  name: string
}
