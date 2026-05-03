import type { TemplateId } from '../stores/types'

export type TemplateCategory = 'all' | 'recommended' | 'simple' | 'modern' | 'compact' | 'creative'

export type TemplateMeta = {
  id: TemplateId
  name: string
  description: string
  categories: Array<Exclude<TemplateCategory, 'all'>>
  atsSafe: boolean
}

export const TEMPLATE_LIBRARY: Array<TemplateMeta> = [
  {
    id: 'professional',
    name: 'Pro ATS',
    description: 'Centered header, recruiter-safe spacing, and restrained color.',
    categories: ['recommended', 'simple'],
    atsSafe: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional section dividers with a polished editorial header.',
    categories: ['recommended', 'simple'],
    atsSafe: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sharper section labels and accent-first hierarchy.',
    categories: ['modern', 'creative'],
    atsSafe: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense layout for experienced candidates and longer resumes.',
    categories: ['compact', 'recommended'],
    atsSafe: true,
  },
]

export function templatesForCategory(category: TemplateCategory) {
  if (category === 'all') return TEMPLATE_LIBRARY
  return TEMPLATE_LIBRARY.filter((template) => template.categories.includes(category))
}

export function templateName(id: TemplateId) {
  return TEMPLATE_LIBRARY.find((template) => template.id === id)?.name ?? id
}
