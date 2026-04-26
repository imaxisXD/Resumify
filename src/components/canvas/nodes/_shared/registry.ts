import {
  Briefcase,
  GraduationCap,
  Layers,
  ListChecks,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { NodeKind } from '../../../../stores/types'
import { PALETTE_ORDER, SECTION_INFO } from '../../../../stores/resumeSections'

export type NodeMeta = {
  kind: NodeKind
  label: string
  hint: string
  icon: LucideIcon
  color: string
}

export const NODE_META: Record<NodeKind, NodeMeta> = {
  personal: {
    kind: 'personal',
    label: SECTION_INFO.personal.label,
    hint: SECTION_INFO.personal.hint,
    icon: User,
    color: 'from-indigo-500 to-violet-500',
  },
  summary: {
    kind: 'summary',
    label: SECTION_INFO.summary.label,
    hint: SECTION_INFO.summary.hint,
    icon: Sparkles,
    color: 'from-amber-400 to-rose-400',
  },
  experience: {
    kind: 'experience',
    label: SECTION_INFO.experience.label,
    hint: SECTION_INFO.experience.hint,
    icon: Briefcase,
    color: 'from-emerald-400 to-teal-500',
  },
  education: {
    kind: 'education',
    label: SECTION_INFO.education.label,
    hint: SECTION_INFO.education.hint,
    icon: GraduationCap,
    color: 'from-sky-400 to-indigo-500',
  },
  skills: {
    kind: 'skills',
    label: SECTION_INFO.skills.label,
    hint: SECTION_INFO.skills.hint,
    icon: Wrench,
    color: 'from-fuchsia-400 to-rose-500',
  },
  projects: {
    kind: 'projects',
    label: SECTION_INFO.projects.label,
    hint: SECTION_INFO.projects.hint,
    icon: Layers,
    color: 'from-yellow-400 to-amber-500',
  },
  custom: {
    kind: 'custom',
    label: SECTION_INFO.custom.label,
    hint: SECTION_INFO.custom.hint,
    icon: ListChecks,
    color: 'from-slate-400 to-zinc-400',
  },
}
export { PALETTE_ORDER }
