import { describe, expect, it } from 'vitest'
import { makeNewResume } from '../stores/resumeSections'
import type { ExperienceData, PersonalData, SkillsData } from '../stores/types'
import { buildAiPrompt, fallbackBulletQuality, parseAiBulletQuality, parseAiSuggestion } from './aiTasks'
import { parseResumeText } from './importResume'
import { matchJob } from './jobMatch'

describe('AI behavior eval fixtures', () => {
  it('asks for evidence when a bullet needs metrics instead of inventing a number', () => {
    const prompt = buildAiPrompt({
      kind: 'bullet-doctor',
      mode: 'auto',
      role: 'Frontend Developer',
      company: 'Supplyhouse',
      bullet: 'Led the migration from a Java stack to React, improving SEO and delivering a superior user experience.',
    })

    expect(prompt).toContain('do not invent one')

    const suggestion = parseAiSuggestion(
      JSON.stringify({
        title: 'Metric needed',
        summary: 'The action is clear, but the result needs evidence before adding numbers.',
        suggestions: [
          {
            id: 'rewrite-1',
            label: 'Tighter rewrite',
            value: 'Migrated the frontend from Java to React, improving SEO readiness and the user experience.',
          },
        ],
        questions: [
          'Did organic traffic, Lighthouse SEO score, page speed, or conversion improve after the migration?',
          'How many pages, users, or services were affected by the migration?',
        ],
      }),
      'Bullet Doctor',
    )

    expect(suggestion.suggestions[0].value).not.toMatch(/\b\d+%/)
    expect(suggestion.questions?.[0]).toContain('organic traffic')
  })

  it('recognizes a metric-rich bullet as strong while allowing optional polish', () => {
    const review = parseAiBulletQuality(
      JSON.stringify({
        status: 'strong',
        label: 'Metric-rich impact',
        summary: 'Clear action, measurable outcomes, and credible technical specificity.',
        confidence: 0.9,
        suggestions: ['Consider splitting the security and performance results if space allows.'],
      }),
      fallbackBulletQuality([]),
    )

    expect(review.status).toBe('strong')
    expect(review.suggestions[0]).toContain('splitting')
  })

  it('turns imported PDF-style text into structured resume sections', () => {
    const resume = parseResumeText(`
Abhishek Abhishek
sunny735084@gmail.com • +919972940600 • Remote

SKILLS
React, TypeScript, Next.js, Tailwind CSS, Accessibility, Performance Optimization

EXPERIENCE
Supplyhouse 07/2024 - Present
Frontend Developer Remote
• Led the migration from a Java stack to React, improving SEO and delivering a superior user experience.
• Enhanced website accessibility to Level AA.

Gamezop 11/2023 - 04/2024
Frontend Developer Remote
• Increased Progressive Web App installation metrics by 15%.

EDUCATION
Bachelor of Engineering in Computer Science
Visvesvaraya Technological University 10/2020
`)

    const personal = resume.sections.find((section) => section.type === 'personal')?.data as PersonalData | undefined
    const skills = resume.sections.find((section) => section.type === 'skills')?.data as SkillsData | undefined
    const experience = resume.sections.find((section) => section.type === 'experience')?.data as ExperienceData | undefined

    expect(personal?.email).toBe('sunny735084@gmail.com')
    expect(skills?.groups[0]?.skills).toContain('TypeScript')
    expect(experience?.items).toHaveLength(2)
    expect(experience?.items[0]?.bullets[0]?.text).toContain('migration')
  })

  it('keeps deterministic job-match context available to AI prompts', () => {
    const resume = makeNewResume('Target React resume')
    const jobDescription = 'Frontend role using React, TypeScript, GraphQL, accessibility, and design systems.'
    const match = matchJob(resume, jobDescription)
    const prompt = buildAiPrompt({
      kind: 'job-match-optimizer',
      resume,
      jobDescription,
    })

    expect(match.matchedKeywords).toContain('react')
    expect(match.missingKeywords).toContain('graphql')
    expect(prompt).toContain('deterministicJobMatch')
    expect(prompt).toContain('graphql')
  })
})
