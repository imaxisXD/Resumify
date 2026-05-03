import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { AiSettings } from '../stores/types'
import {
  buildAiPrompt,
  buildBulletQualityPrompt,
  fallbackBulletQuality,
  fallbackSuggestion,
  parseAiBulletQuality,
  parseAiSuggestion,
  type AiBulletQuality,
  type AiSuggestion,
  type AiTaskInput,
} from './aiTasks'
import type { ScoreIssue } from './resumeScore'

export async function askAi(settings: AiSettings, prompt: string): Promise<string> {
  if (!settings.enabled) throw new Error('AI is turned off.')
  if (settings.provider === 'codex-local') return askCodexLocal(settings, prompt)
  if (settings.provider === 'openai') return askOpenAi(settings, prompt)
  if (!settings.apiKey.trim()) throw new Error('Add your OpenRouter key in Settings.')
  const openrouter = createOpenRouter({
    apiKey: settings.apiKey.trim(),
    appName: 'Resumify',
    appUrl: 'http://localhost',
  })
  const { text } = await generateText({
    model: openrouter(openRouterModel(settings.model)),
    system:
      'You improve resumes. Keep output short, factual, ATS safe, and plain text. Do not invent private facts.',
    prompt,
  })
  return text
}

function openRouterModel(model: string) {
  const clean = model.trim() || 'openai/gpt-4o-mini'
  return clean.includes('/') ? clean : `openai/${clean}`
}

export async function runAiTask(settings: AiSettings, input: AiTaskInput): Promise<AiSuggestion> {
  try {
    const raw = await askAi(settings, buildAiPrompt(input))
    return parseAiSuggestion(raw, labelForTask(input.kind))
  } catch (error) {
    if (settings.provider === 'codex-local' && !isAiDisabledError(error)) return fallbackSuggestion(input, error)
    throw error
  }
}

export async function reviewBulletQualityWithAi(
  settings: AiSettings,
  input: {
    bullet: string
    role?: string
    company?: string
    heuristicIssues: Array<ScoreIssue>
  },
): Promise<AiBulletQuality> {
  const fallback = fallbackBulletQuality(input.heuristicIssues)
  try {
    const raw = await askAi(settings, buildBulletQualityPrompt(input))
    return parseAiBulletQuality(raw, fallback)
  } catch (error) {
    if (settings.provider === 'codex-local' && !isAiDisabledError(error)) return fallback
    throw error
  }
}

export async function improveBulletWithAi(settings: AiSettings, bullet: string, jobDescription?: string) {
  const result = await runAiTask(settings, {
    kind: 'bullet-doctor',
    bullet,
    jobDescription,
    mode: 'stronger',
  })
  return result.suggestions[0]?.value ?? bullet
}

export async function suggestKeywordsWithAi(settings: AiSettings, resumeText: string, jobDescription: string) {
  return askAi(
    settings,
    `List missing resume keywords as comma-separated words only.\n\nResume:\n${resumeText}\n\nJob description:\n${jobDescription}`,
  )
}

async function askCodexLocal(settings: AiSettings, prompt: string): Promise<string> {
  const endpoint = settings.localEndpoint || 'http://127.0.0.1:4317'
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/runTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: settings.model || 'gpt-5.4-mini' }),
  })
  if (!response.ok) throw new Error('Codex local sidecar is not available.')
  const data = (await response.json()) as { text?: string; error?: string }
  if (data.error) throw new Error(data.error)
  return data.text ?? ''
}

async function askOpenAi(settings: AiSettings, prompt: string): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Add your OpenAI API key in Settings.')
  const response = await fetch(settings.endpoint || 'https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-5.4-mini',
      instructions: 'You improve resumes. Keep output factual, ATS safe, and plain text. Do not invent private facts.',
      input: prompt,
    }),
  })
  if (!response.ok) throw new Error(`OpenAI request failed (${response.status}).`)
  const data = (await response.json()) as {
    output_text?: string
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>
  }
  return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('\n') ?? ''
}

function isAiDisabledError(error: unknown) {
  return error instanceof Error && error.message === 'AI is turned off.'
}

function labelForTask(kind: AiTaskInput['kind']) {
  return {
    'bullet-doctor': 'Bullet Doctor',
    'metric-finder': 'Metric Finder',
    'summary-generator': 'Summary Generator',
    'skills-cleanup': 'Skills Cleanup',
    'job-match-optimizer': 'Job Match Optimizer',
    'variant-generator': 'Resume Variant',
  }[kind]
}
