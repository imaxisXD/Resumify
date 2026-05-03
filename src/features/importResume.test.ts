import { describe, expect, it } from 'vitest'
import { parseResumeText } from './importResume'
import type { ExperienceData, PersonalData, ProjectsData } from '../stores/types'

describe('resume import parser', () => {
  it('creates sections from pasted text', () => {
    const resume = parseResumeText('Jane Doe\nFrontend Engineer\njane@example.com\nReact TypeScript\n- Improved load time by 30%')
    expect(resume.sections.map((section) => section.type)).toContain('personal')
    expect(resume.sections.map((section) => section.type)).toContain('skills')
    expect(JSON.stringify(resume)).toContain('jane@example.com')
  })

  it('extracts a multi-role frontend resume from PDF text', () => {
    const resume = parseResumeText(`
Abhishek Abhishek
+919972940600 • sunny735084@gmail.com • linkedin.com/in/abhishek-ichi • https://peerlist.io/imabhishek

SKILLS
Next.js, TypeScript, React.js, Tailwind CSS, JavaScript, Node.js, Git, AWS S3, REST APIs, Socket.IO, WebSocket, Accessibility

WORK EXPERIENCE
Supplyhouse 07/2024 - Present
Frontend Developer • Full-time Remote
• Enhanced website accessibility to Level AA, resulting in an approx 0.5% increase in sales.
• Led the migration from a Java stack to React, improving SEO and delivering a superior user experience.

Gamezop 11/2023 - 04/2024
Frontend Developer Remote
• Improved homepage rendering performance by 30%, resulting in a faster and more engaging user experience.

Publicis Sapient 04/2021 - 03/2023
Associate Technology L2 / Frontend Gurgaon, India
• Improved payment page security by implementing a CAPTCHA system, reducing fraudulent orders by 47.8%.

EDUCATION
Bachelor of Engineering in Computer Science
Visvesvaraya Technological University, Bangalore • 10/2020

PROJECTS
Superlinkify
https://superlinkify.com/
• Developed a tool to address marketing and growth challenges on LinkedIn.
• Tech Stack: Next.js, TypeScript, Tailwind CSS, AI, Vercel

Gamezop V2
https://gamezop-v2.vercel.app/
• Developed a fully functional clone of Gamezop utilizing the Next.js App Router.
`)
    const personal = resume.sections.find((section) => section.type === 'personal')
    const skills = resume.sections.find((section) => section.type === 'skills')
    const experience = resume.sections.find((section) => section.type === 'experience')
    const projects = resume.sections.find((section) => section.type === 'projects')

    expect((personal?.data as PersonalData | undefined)?.fullName).toBe('Abhishek Abhishek')
    expect((personal?.data as PersonalData | undefined)?.email).toBe('sunny735084@gmail.com')
    expect(JSON.stringify(skills)).toContain('Next.js')
    expect((experience?.data as ExperienceData | undefined)?.items).toHaveLength(3)
    expect((experience?.data as ExperienceData | undefined)?.items[0]?.company).toBe('Supplyhouse')
    expect((projects?.data as ProjectsData | undefined)?.items).toHaveLength(2)
  })
})
