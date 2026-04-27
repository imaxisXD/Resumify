import { describe, expect, it } from 'vitest'
import { makeNewResume } from '../stores/resumeSections'
import { extractKeywords, matchJob } from './jobMatch'

describe('job match', () => {
  it('extracts useful keywords', () => {
    expect(extractKeywords('React TypeScript Postgres React')).toContain('react')
  })

  it('finds matched and missing job words', () => {
    const result = matchJob(makeNewResume('Test'), 'React TypeScript Kubernetes')
    expect(result.matchedKeywords).toContain('react')
    expect(result.missingKeywords).toContain('kubernetes')
  })
})
