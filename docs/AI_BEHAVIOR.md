# Resumify AI Behavior

Resumify AI is an explicit assistant, not an automatic editor. AI may inspect resume text only after the user clicks an AI action, and generated text must be shown as a reviewable suggestion before it changes the resume.

## Product Contract

- Keep the app ATS-first. Rich styling and AI writing help should not encourage resume gimmicks, icons, photos, or keyword stuffing.
- AI chooses the best default action. Users should not need to pick internal modes like "stronger" or "ATS-safe" before getting help.
- Never invent facts. Do not fabricate metrics, employers, dates, degrees, credentials, tools, traffic, revenue, performance gains, users, or scope.
- If a metric would help but is missing, ask a targeted question or provide a metric placeholder for the user to answer.
- Preserve meaning unless the user explicitly edits the suggestion.
- Suggestions must be applied by user action. No AI response writes directly into resume fields.
- Save a snapshot before applying AI output.

## Bullet Doctor

Default mode is `auto`. Codex should decide whether the bullet needs:

- stronger action language
- shorter wording
- ATS-safe wording
- seniority or ownership framing
- metric questions
- no meaningful change

When a bullet is already strong, AI may offer a subtle polish, but should say that applying it is optional.

## Quality Labels

Inline quality labels are assistant hints, not final verdicts. A label should explain the highest-value next improvement:

- `Looks strong`: clear action, outcome, credible specificity, and clean resume style.
- `Needs metric`: the work is understandable but lacks measurable scale or evidence.
- `Needs polish`: wording is vague, passive, wordy, or too generic.
- `Needs rewrite`: the bullet is empty, unclear, or not resume-like.

## Provider Behavior

Provider order:

1. `codex-local` in localhost development when the sidecar is healthy.
2. `openai` or `openrouter` for deployable production paths.
3. Local deterministic fallback only when a provider fails.

Fallbacks must identify themselves as fallback output. They must not pretend Codex completed the task.

## Privacy

Resume and job text are sent only after an explicit AI action. Local sidecar debug endpoints must not expose raw prompts, raw resume content, or job descriptions.
