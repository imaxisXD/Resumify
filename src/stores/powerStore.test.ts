import { beforeEach, describe, expect, it } from 'vitest'
import { useResumeStore } from './resumeStore'

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
})
