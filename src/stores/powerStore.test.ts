import { beforeEach, describe, expect, it } from 'vitest'
import { useResumeStore } from './resumeStore'
import { makeNewResume } from './resumeSections'
import type { ResumeBackup } from './types'

describe('power store features', () => {
  beforeEach(() => {
    useResumeStore.setState({
      resumes: {},
      order: [],
      profileLibrary: [],
      resumeHistory: {},
      jobMatches: {},
      selectedSectionId: null,
    })
  })

  it('saves and restores versions', () => {
    const id = useResumeStore.getState().createResume('Version Test')
    const snapshotId = useResumeStore.getState().saveSnapshot(id, 'Start')
    expect(snapshotId).toBeTruthy()
    useResumeStore.getState().renameResume(id, 'Changed')
    useResumeStore.getState().restoreSnapshot(id, snapshotId || '')
    expect(useResumeStore.getState().resumes[id].name).toBe('Version Test')
  })

  it('exports and imports backup data', () => {
    const id = useResumeStore.getState().createResume('Backup Test')
    useResumeStore.getState().saveProfileFromResume(id)
    const backup = useResumeStore.getState().exportBackup()
    useResumeStore.setState({ resumes: {}, order: [], profileLibrary: [] })
    useResumeStore.getState().importBackup(backup)
    expect(useResumeStore.getState().order).toContain(id)
    expect(useResumeStore.getState().profileLibrary.length).toBe(1)
  })

  it('migrates older backup settings and resume style fields', () => {
    const resume = makeNewResume('Legacy')
    const legacyResume = {
      ...resume,
      style: { font: 'serif', spacing: 'normal', pageSize: 'letter', accentColor: '#111111' },
    }
    const backup = {
      version: 3,
      exportedAt: 1,
      resumes: { [resume.id]: legacyResume },
      order: [resume.id],
      profileLibrary: [],
      resumeHistory: {},
      jobMatches: {},
      aiSettings: { enabled: true, apiKey: 'key', model: 'openai/gpt-4o-mini' },
    } as unknown as ResumeBackup

    useResumeStore.getState().importBackup(backup)

    expect(useResumeStore.getState().resumes[resume.id].style.fontSize).toBe(13)
    expect(useResumeStore.getState().resumes[resume.id].style.viewAsPages).toBe(true)
    expect(useResumeStore.getState().aiSettings.provider).toBeTruthy()
    expect(useResumeStore.getState().aiSettings.localEndpoint).toBe('http://127.0.0.1:4317')
  })
})
