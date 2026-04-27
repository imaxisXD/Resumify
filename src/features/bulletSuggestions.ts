export type BulletSuggestion = {
  original: string
  suggested: string
  reason: string
}

const weakStarters = /^(worked on|helped|responsible for|handled|did|made)\b/i

export function suggestBullet(text: string, role = 'the team'): BulletSuggestion {
  const clean = text.trim()
  if (!clean) {
    return {
      original: text,
      suggested: `Delivered a measurable improvement for ${role} by owning a clear project outcome.`,
      reason: 'Empty bullets need action and impact.',
    }
  }
  const action = clean.replace(weakStarters, 'Improved')
  const needsMetric = !/\d|%|users?|customers?|revenue|saved|reduced|increased/i.test(action)
  return {
    original: text,
    suggested: needsMetric ? `${action}, improving team speed or quality by a measurable amount.` : action,
    reason: needsMetric ? 'Add a number or result.' : 'Start with stronger action.',
  }
}

export function suggestBullets(bullets: Array<string>, role?: string): Array<BulletSuggestion> {
  return bullets.map((bullet) => suggestBullet(bullet, role))
}
