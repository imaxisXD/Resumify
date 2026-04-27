import { describe, expect, it } from 'vitest'
import { parseResumeText } from './importResume'

describe('resume import parser', () => {
  it('creates sections from pasted text', () => {
    const resume = parseResumeText('Jane Doe\nFrontend Engineer\njane@example.com\nReact TypeScript\n- Improved load time by 30%')
    expect(resume.sections.map((section) => section.type)).toContain('personal')
    expect(resume.sections.map((section) => section.type)).toContain('skills')
    expect(JSON.stringify(resume)).toContain('jane@example.com')
  })
})
