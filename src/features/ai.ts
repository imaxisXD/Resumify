import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { AiSettings } from '../stores/types'

export async function askAi(settings: AiSettings, prompt: string): Promise<string> {
  if (!settings.enabled) throw new Error('AI is turned off.')
  if (!settings.apiKey.trim()) throw new Error('Add your OpenRouter key in Settings.')
  const openrouter = createOpenRouter({
    apiKey: settings.apiKey.trim(),
    appName: 'Resumify',
    appUrl: 'http://localhost',
  })
  const { text } = await generateText({
    model: openrouter(settings.model || 'openai/gpt-4o-mini'),
    system:
      'You improve resumes. Keep output short, factual, ATS safe, and plain text. Do not invent private facts.',
    prompt,
  })
  return text
}

export async function improveBulletWithAi(settings: AiSettings, bullet: string, jobDescription?: string) {
  return askAi(
    settings,
    `Improve this resume bullet. Keep it one bullet and do not invent numbers.\n\nBullet: ${bullet}\n\nJob description:\n${jobDescription || 'Not provided'}`,
  )
}

export async function suggestKeywordsWithAi(settings: AiSettings, resumeText: string, jobDescription: string) {
  return askAi(
    settings,
    `List missing resume keywords as comma-separated words only.\n\nResume:\n${resumeText}\n\nJob description:\n${jobDescription}`,
  )
}
