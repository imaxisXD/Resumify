import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

import { DEFAULT_RESUME_STYLE } from './types'
import type {
  SectionDataMap,
  SectionKind,
  Resume,
  ResumeSection,
  ResumeStyle,
  PersonalData,
  ExperienceData,
  ProjectsData,
  SkillsData,
  EducationData,
  TemplateId,
  Theme,
  Profile,
  ResumeSnapshot,
  JobMatch,
  AiSettings,
  ResumeBackup,
} from './types'
import { createResumeSection, defaultDataFor, makeNewResume, SECTION_ORDER } from './resumeSections'

type LegacyResume = Resume & {
  nodes?: Array<ResumeSection>
  edges?: Array<unknown>
}

type State = {
  theme: Theme
  resumes: Record<string, Resume>
  order: Array<string>
  selectedSectionId: string | null
  view: 'builder' | 'preview' | 'both'
  hasHydrated: boolean
  profileLibrary: Array<Profile>
  resumeHistory: Record<string, Array<ResumeSnapshot>>
  jobMatches: Record<string, Array<JobMatch>>
  aiSettings: AiSettings
}

type Actions = {
  setTheme: (t: Theme) => void
  setView: (v: State['view']) => void
  setSelectedSection: (id: string | null) => void
  setHasHydrated: (b: boolean) => void

  createResume: (name?: string) => string
  deleteResume: (id: string) => void
  renameResume: (id: string, name: string) => void
  duplicateResume: (id: string) => string | null
  setTemplate: (id: string, t: TemplateId) => void
  setResumeStyle: (id: string, patch: Partial<ResumeStyle>) => void

  addSection: <K extends SectionKind>(id: string, kind: K) => string
  removeSection: (id: string, sectionId: string) => void
  reorderSections: (id: string, sections: Array<ResumeSection>) => void
  toggleSection: (id: string, sectionId: string, enabled: boolean) => void
  updateSectionData: <K extends SectionKind>(id: string, sectionId: string, patch: Partial<SectionDataMap[K]>) => void
  replaceResume: (id: string, resume: Resume, label?: string) => void
  saveProfileFromResume: (id: string, name?: string) => string | null
  applyProfileToResume: (resumeId: string, profileId: string, mode?: 'fill' | 'replace') => void
  deleteProfile: (profileId: string) => void
  saveSnapshot: (resumeId: string, label: string) => string | null
  restoreSnapshot: (resumeId: string, snapshotId: string) => void
  deleteSnapshot: (resumeId: string, snapshotId: string) => void
  saveJobMatch: (match: Omit<JobMatch, 'id' | 'createdAt'>) => string
  deleteJobMatch: (resumeId: string, matchId: string) => void
  setAiSettings: (patch: Partial<AiSettings>) => void
  exportBackup: () => ResumeBackup
  importBackup: (backup: ResumeBackup) => void
}

const STORAGE_KEY = 'resumify.v2'

export const useResumeStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resumes: {},
      order: [],
      selectedSectionId: null,
      view: 'both',
      hasHydrated: false,
      profileLibrary: [],
      resumeHistory: {},
      jobMatches: {},
      aiSettings: {
        enabled: false,
        apiKey: '',
        model: 'openai/gpt-4o-mini',
      },

      setTheme: (t) => set({ theme: t }),
      setView: (v) => set({ view: v }),
      setSelectedSection: (id) => set({ selectedSectionId: id }),
      setHasHydrated: (b) => set({ hasHydrated: b }),

      createResume: (name) => {
        const r = makeNewResume(name ?? `Resume ${Object.keys(get().resumes).length + 1}`)
        set((s) => ({
          resumes: { ...s.resumes, [r.id]: r },
          order: [r.id, ...s.order],
          selectedSectionId: r.sections[0]?.id ?? null,
        }))
        return r.id
      },

      deleteResume: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.resumes
          return { resumes: rest, order: s.order.filter((x) => x !== id) }
        })
      },

      renameResume: (id, name) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          return { resumes: { ...s.resumes, [id]: { ...r, name, updatedAt: Date.now() } } }
        })
      },

      duplicateResume: (id) => {
        const src = get().resumes[id]
        if (!src) return null
        const newId = nanoid(8)
        const sections = src.sections.map((section) => ({
          ...section,
          id: `${section.type}-${nanoid(6)}`,
          data: cloneData(section.data),
        })) as Array<ResumeSection>
        const copy: Resume = {
          ...src,
          id: newId,
          name: `${src.name} (copy)`,
          sections,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          resumes: { ...s.resumes, [newId]: copy },
          order: [newId, ...s.order],
          selectedSectionId: sections[0]?.id ?? null,
        }))
        return newId
      },

      setTemplate: (id, t) => {
        set((s) => updateResume(s, id, (r) => ({ ...r, templateId: t, updatedAt: Date.now() })))
      },

      setResumeStyle: (id, patch) => {
        set((s) =>
          updateResume(s, id, (r) => ({
            ...r,
            style: { ...DEFAULT_RESUME_STYLE, ...r.style, ...patch },
            updatedAt: Date.now(),
          })),
        )
      },

      addSection: (id, kind) => {
        const section = createResumeSection(kind) as ResumeSection
        set((s) =>
          updateResume(s, id, (r) => ({
            ...r,
            sections: [...r.sections, section],
            updatedAt: Date.now(),
          })),
        )
        set({ selectedSectionId: section.id })
        return section.id
      },

      removeSection: (id, sectionId) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          const section = r.sections.find((item) => item.id === sectionId)
          if (!section || section.locked || section.type === 'personal') return s
          const sections = r.sections.filter((item) => item.id !== sectionId)
          return {
            resumes: { ...s.resumes, [id]: { ...r, sections, updatedAt: Date.now() } },
            selectedSectionId: s.selectedSectionId === sectionId ? sections[0]?.id ?? null : s.selectedSectionId,
          }
        })
      },

      reorderSections: (id, sections) => {
        set((s) =>
          updateResume(s, id, (r) => ({
            ...r,
            sections: keepPersonalFirst(sections),
            updatedAt: Date.now(),
          })),
        )
      },

      toggleSection: (id, sectionId, enabled) => {
        set((s) =>
          updateResume(s, id, (r) => ({
            ...r,
            sections: r.sections.map((section) =>
              section.id === sectionId && section.type !== 'personal'
                ? { ...section, enabled }
                : section,
            ),
            updatedAt: Date.now(),
          })),
        )
      },

      updateSectionData: (id, sectionId, patch) => {
        set((s) =>
          updateResume(s, id, (r) => ({
            ...r,
            sections: r.sections.map((section) =>
              section.id === sectionId
                ? ({ ...section, data: { ...section.data, ...patch } } as ResumeSection)
                : section,
            ),
            updatedAt: Date.now(),
          })),
        )
      },

      replaceResume: (id, resume, label = 'Before replace') => {
        get().saveSnapshot(id, label)
        const normalized = normalizeResume({ ...resume, id, updatedAt: Date.now() })
        set((s) => ({
          resumes: { ...s.resumes, [id]: normalized },
          selectedSectionId: normalized.sections[0]?.id ?? null,
        }))
      },

      saveProfileFromResume: (id, name) => {
        const resume = get().resumes[id]
        if (!resume) return null
        const profile = profileFromResume(resume, name)
        set((s) => ({
          profileLibrary: [profile, ...s.profileLibrary.filter((item) => item.name !== profile.name)],
        }))
        return profile.id
      },

      applyProfileToResume: (resumeId, profileId, mode = 'fill') => {
        const profile = get().profileLibrary.find((item) => item.id === profileId)
        if (!profile) return
        get().saveSnapshot(resumeId, 'Before profile apply')
        set((s) =>
          updateResume(s, resumeId, (resume) => ({
            ...resume,
            sections: applyProfileSections(resume.sections, profile, mode),
            updatedAt: Date.now(),
          })),
        )
      },

      deleteProfile: (profileId) => {
        set((s) => ({ profileLibrary: s.profileLibrary.filter((item) => item.id !== profileId) }))
      },

      saveSnapshot: (resumeId, label) => {
        const resume = get().resumes[resumeId]
        if (!resume) return null
        const snapshot: ResumeSnapshot = {
          id: nanoid(8),
          resumeId,
          label: label.trim() || 'Saved version',
          resume: cloneData(resume),
          createdAt: Date.now(),
        }
        set((s) => ({
          resumeHistory: {
            ...s.resumeHistory,
            [resumeId]: [snapshot, ...(s.resumeHistory[resumeId] ?? [])].slice(0, 30),
          },
        }))
        return snapshot.id
      },

      restoreSnapshot: (resumeId, snapshotId) => {
        const snapshot = get().resumeHistory[resumeId]?.find((item) => item.id === snapshotId)
        if (!snapshot) return
        get().saveSnapshot(resumeId, 'Before restore')
        set((s) => ({
          resumes: {
            ...s.resumes,
            [resumeId]: normalizeResume({
              ...cloneData(snapshot.resume),
              id: resumeId,
              updatedAt: Date.now(),
            }),
          },
        }))
      },

      deleteSnapshot: (resumeId, snapshotId) => {
        set((s) => ({
          resumeHistory: {
            ...s.resumeHistory,
            [resumeId]: (s.resumeHistory[resumeId] ?? []).filter((item) => item.id !== snapshotId),
          },
        }))
      },

      saveJobMatch: (match) => {
        const saved: JobMatch = { ...match, id: nanoid(8), createdAt: Date.now() }
        set((s) => ({
          jobMatches: {
            ...s.jobMatches,
            [match.resumeId]: [saved, ...(s.jobMatches[match.resumeId] ?? [])].slice(0, 20),
          },
        }))
        return saved.id
      },

      deleteJobMatch: (resumeId, matchId) => {
        set((s) => ({
          jobMatches: {
            ...s.jobMatches,
            [resumeId]: (s.jobMatches[resumeId] ?? []).filter((item) => item.id !== matchId),
          },
        }))
      },

      setAiSettings: (patch) => {
        set((s) => ({ aiSettings: { ...s.aiSettings, ...patch } }))
      },

      exportBackup: () => {
        const s = get()
        return {
          version: 3,
          exportedAt: Date.now(),
          resumes: s.resumes,
          order: s.order,
          profileLibrary: s.profileLibrary,
          resumeHistory: s.resumeHistory,
          jobMatches: s.jobMatches,
          aiSettings: s.aiSettings,
        }
      },

      importBackup: (backup) => {
        set((s) => ({
          resumes: Object.fromEntries(
            Object.entries(backup.resumes ?? {}).map(([id, resume]) => [id, normalizeResume(resume as LegacyResume)]),
          ),
          order: backup.order ?? Object.keys(backup.resumes ?? {}),
          profileLibrary: backup.profileLibrary ?? s.profileLibrary,
          resumeHistory: backup.resumeHistory ?? s.resumeHistory,
          jobMatches: backup.jobMatches ?? s.jobMatches,
          aiSettings: backup.aiSettings ?? s.aiSettings,
        }))
      },

    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const raw = window.localStorage.getItem(name) ?? window.localStorage.getItem('resumify.v1')
          if (!raw) return null
          try {
            return JSON.parse(raw)
          } catch {
            window.localStorage.removeItem(name)
            return null
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          window.localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          window.localStorage.removeItem(name)
        },
      },
      partialize: (s) =>
        ({
          theme: s.theme,
          resumes: s.resumes,
          order: s.order,
          view: s.view,
          selectedSectionId: s.selectedSectionId,
          profileLibrary: s.profileLibrary,
          resumeHistory: s.resumeHistory,
          jobMatches: s.jobMatches,
          aiSettings: s.aiSettings,
        }) as State & Actions,
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<State>) } as State & Actions
        state.resumes = Object.fromEntries(
          Object.entries(state.resumes ?? {}).map(([id, resume]) => [id, normalizeResume(resume as LegacyResume)]),
        )
        state.profileLibrary = state.profileLibrary ?? []
        state.resumeHistory = state.resumeHistory ?? {}
        state.jobMatches = state.jobMatches ?? {}
        state.aiSettings = { ...defaultAiSettings, ...state.aiSettings }
        return state
      },
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.setHasHydrated(true)
          return
        }
        if (error) {
          useResumeStore.setState({ hasHydrated: true })
        }
      },
    },
  ),
)

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    if (!useResumeStore.getState().hasHydrated) {
      useResumeStore.setState({ hasHydrated: true })
    }
  })
}

export function getResume(id: string | undefined): Resume | undefined {
  if (!id) return undefined
  return useResumeStore.getState().resumes[id]
}

export function selectOrderedSections(resume: Resume): Array<ResumeSection> {
  return resume.sections.filter((section) => section.enabled)
}

export function selectDisconnectedSections(): Array<ResumeSection> {
  return []
}

export function selectErrors(resume: Resume): Array<{ id: string; message: string }> {
  const personal = resume.sections.find((section) => section.type === 'personal')
  const issues: Array<{ id: string; message: string }> = []
  if (!personal) return [{ id: resume.id, message: 'Add a Personal section.' }]

  const data = personal.data as PersonalData
  if (!data.fullName?.trim()) issues.push({ id: personal.id, message: 'Add your name in Personal.' })
  if (!data.email?.trim()) issues.push({ id: personal.id, message: 'Add your email in Personal.' })
  if (!data.phone?.trim()) issues.push({ id: personal.id, message: 'Add your phone number in Personal.' })
  if (!data.location?.trim()) issues.push({ id: personal.id, message: 'Add your location in Personal.' })

  const enabled = resume.sections.filter((section) => section.enabled)
  const experience = enabled.find((section) => section.type === 'experience')
  const skills = enabled.find((section) => section.type === 'skills')
  const projects = enabled.find((section) => section.type === 'projects')

  if (!skills) {
    issues.push({ id: resume.id, message: 'Add a Skills section with role keywords.' })
  } else {
    const skillData = skills.data as SkillsData
    const skillCount = skillData.groups.flatMap((group) => group.skills).filter(Boolean).length
    if (skillCount < 8) issues.push({ id: skills.id, message: 'Add more skills so ATS systems can match keywords.' })
  }

  if (!experience) {
    issues.push({ id: resume.id, message: 'Add Work Experience with measurable bullet points.' })
  } else {
    const experienceData = experience.data as ExperienceData
    if (experienceData.items.length === 0) {
      issues.push({ id: experience.id, message: 'Add at least one work role.' })
    }
    for (const item of experienceData.items) {
      if (!item.role.trim() || !item.company.trim()) {
        issues.push({ id: item.id, message: 'Add role and company for every work entry.' })
      }
      if (item.bullets.filter((bullet) => bullet.text.trim()).length < 2) {
        issues.push({ id: item.id, message: `Add at least 2 bullets for ${item.company || item.role || 'each role'}.` })
      }
    }
  }

  if (projects) {
    const projectData = projects.data as ProjectsData
    for (const item of projectData.items) {
      if (item.name.trim() && item.bullets.filter((bullet) => bullet.text.trim()).length === 0 && !item.description.trim()) {
        issues.push({ id: item.id, message: `Add impact details for ${item.name}.` })
      }
    }
  }

  return issues
}

export function emptyDataFor<K extends SectionKind>(kind: K) {
  return defaultDataFor(kind)
}

export const defaultResumeStyle: ResumeStyle = DEFAULT_RESUME_STYLE

function updateResume(
  state: State & Actions,
  id: string,
  updater: (resume: Resume) => Resume,
): Partial<State> | State {
  const r = state.resumes[id]
  if (!r) return state
  return { resumes: { ...state.resumes, [id]: updater(r) } }
}

function normalizeResume(resume: LegacyResume): Resume {
  const sections = resume.sections ?? resume.nodes ?? []
  const normalizedSections = keepPersonalFirst(
    sections.map((section) => ({
      ...section,
      enabled: section.enabled ?? true,
      locked: section.locked ?? section.type === 'personal',
    })),
  )

  return {
    id: resume.id,
    name: resume.name,
    templateId: resume.templateId ?? 'professional',
    style: { ...DEFAULT_RESUME_STYLE, ...resume.style },
    sections: normalizedSections.length ? normalizedSections : makeNewResume(resume.name).sections,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  }
}

function keepPersonalFirst(sections: Array<ResumeSection>): Array<ResumeSection> {
  const personal = sections.find((section) => section.type === 'personal')
  const rest = sections.filter((section) => section.type !== 'personal')
  return personal ? [personal, ...rest] : rest
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function profileFromResume(resume: Resume, name?: string): Profile {
  const personal = findData<PersonalData>(resume, 'personal') ?? defaultDataFor('personal')
  return {
    id: nanoid(8),
    name: name?.trim() || personal.fullName || resume.name,
    personal: cloneData(personal),
    education: cloneData(findData<EducationData>(resume, 'education') ?? defaultDataFor('education')),
    skills: cloneData(findData<SkillsData>(resume, 'skills') ?? defaultDataFor('skills')),
    experience: cloneData(findData<ExperienceData>(resume, 'experience') ?? defaultDataFor('experience')),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function findData<T>(resume: Resume, kind: SectionKind): T | null {
  return (resume.sections.find((section) => section.type === kind)?.data as T | undefined) ?? null
}

function applyProfileSections(
  sections: Array<ResumeSection>,
  profile: Profile,
  mode: 'fill' | 'replace',
): Array<ResumeSection> {
  const next = [...sections]
  upsertSection(next, 'personal', profile.personal, mode)
  upsertSection(next, 'education', profile.education, mode)
  upsertSection(next, 'skills', profile.skills, mode)
  upsertSection(next, 'experience', profile.experience, mode)
  return keepPersonalFirst(next)
}

function upsertSection<K extends SectionKind>(
  sections: Array<ResumeSection>,
  kind: K,
  data: SectionDataMap[K],
  mode: 'fill' | 'replace',
) {
  const index = sections.findIndex((section) => section.type === kind)
  if (index === -1) {
    sections.push(createResumeSection(kind, { data: { ...cloneData(data), kind } } as Partial<ResumeSection<K>>) as ResumeSection)
    return
  }
  if (mode === 'replace' || isSectionEmpty(sections[index])) {
    sections[index] = { ...sections[index], data: { ...cloneData(data), kind } } as unknown as ResumeSection
  }
}

const defaultAiSettings: AiSettings = {
  enabled: false,
  apiKey: '',
  model: 'openai/gpt-4o-mini',
}

function isSectionEmpty(section: ResumeSection): boolean {
  const data = section.data as Record<string, unknown>
  if ('items' in data) return Array.isArray(data.items) && data.items.length === 0
  if ('groups' in data) return Array.isArray(data.groups) && data.groups.every((group) => !String((group as { skills?: unknown }).skills ?? '').trim())
  if ('text' in data) return !String(data.text ?? '').trim()
  return false
}

export function missingSectionKinds(resume: Resume): Array<SectionKind> {
  const existing = new Set(resume.sections.map((section) => section.type))
  return SECTION_ORDER.filter((kind) => kind !== 'personal' && !existing.has(kind))
}
