import { describe, expect, it } from 'vitest'
import { makeNewResume } from '../stores/resumeSections'
import {
  buildAiPrompt,
  buildBulletQualityPrompt,
  fallbackBulletQuality,
  fallbackSuggestion,
  parseAiBulletQuality,
  parseAiSuggestion,
} from './aiTasks'

describe('AI tasks', () => {
  it('builds structured prompts with deterministic job context', () => {
    const prompt = buildAiPrompt({
      kind: 'job-match-optimizer',
      resume: makeNewResume('Targeted'),
      jobDescription: 'React TypeScript Kubernetes',
    })
    expect(prompt).toContain('Return only valid JSON')
    expect(prompt).toContain('deterministicJobMatch')
    expect(prompt).toContain('kubernetes')
  })

  it('parses fenced JSON suggestions', () => {
    const suggestion = parseAiSuggestion(
      '```json\n{"title":"Bullet Doctor","summary":"Sharper","suggestions":[{"id":"a","label":"Rewrite","value":"Improved checkout latency by 30%."}]}\n```',
    )
    expect(suggestion.title).toBe('Bullet Doctor')
    expect(suggestion.suggestions[0].value).toContain('30%')
  })

  it('lets AI choose the best bullet edit in auto mode', () => {
    const prompt = buildAiPrompt({
      kind: 'bullet-doctor',
      bullet: 'Led the migration from Java to React, improving SEO.',
      mode: 'auto',
    })

    expect(prompt).toContain('decide the best edit yourself')
    expect(prompt).toContain('do not invent one')
  })

  it('falls back to reviewable local suggestions', () => {
    const suggestion = fallbackSuggestion({
      kind: 'skills-cleanup',
      skills: ['React', 'react ', 'TypeScript', 'React'],
    })
    expect(suggestion.suggestions[0].value).toBe('React, TypeScript')
  })

  it('builds and parses AI bullet quality reviews', () => {
    const prompt = buildBulletQualityPrompt({
      bullet: 'Led checkout rebuild, reducing payment failures by 18%.',
      heuristicIssues: [],
    })
    expect(prompt).toContain('Grammarly-style')

    const quality = parseAiBulletQuality(
      '{"status":"strong","label":"Strong impact","summary":"Clear action and measurable result.","confidence":0.91,"suggestions":[]}',
      fallbackBulletQuality([]),
    )
    expect(quality.status).toBe('strong')
    expect(quality.label).toBe('Strong impact')
    expect(quality.confidence).toBe(0.91)
  })
})
