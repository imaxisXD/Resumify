import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAiTask } from './ai'
import type { AiSettings } from '../stores/types'

const localSettings: AiSettings = {
  enabled: true,
  provider: 'codex-local',
  apiKey: '',
  model: 'gpt-5.4-mini',
  endpoint: '',
  localEndpoint: 'http://127.0.0.1:4317',
}

describe('AI providers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses local Codex responses when healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          text: '{"title":"Bullet Doctor","summary":"Done","suggestions":[{"id":"one","label":"Rewrite","value":"Improved onboarding activation by 12%."}]}',
        }),
      })),
    )

    const result = await runAiTask(localSettings, { kind: 'bullet-doctor', bullet: 'Improved onboarding.' })
    expect(result.suggestions[0].value).toContain('12%')
  })

  it('falls back to a friendly local suggestion when Codex is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))

    const result = await runAiTask(localSettings, { kind: 'bullet-doctor', bullet: 'Built reports.' })
    expect(result.summary).toContain('Codex did not return a usable draft')
    expect(result.suggestions[0].value).toBe('Built reports.')
  })
})
