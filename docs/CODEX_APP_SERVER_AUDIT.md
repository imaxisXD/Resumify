# Codex App Server Audit

Source reviewed: OpenAI Codex App Server docs, `https://developers.openai.com/codex/app-server`.

## Official Shape

Codex App Server is for deep product integrations. It uses JSON-RPC 2.0 over stdio by default, with an experimental WebSocket transport. Clients initialize the connection, start or resume threads, start turns, and then consume streamed notifications for agent messages, tool calls, file changes, approvals, and lifecycle events.

The docs position App Server for rich Codex clients such as IDE extensions. They recommend the Codex SDK for automation, CI, internal workflows, and application integrations that need programmatic control.

## Resumify Fit

Our current need is narrow:

- one user-initiated resume task at a time
- no direct filesystem or shell access from the browser
- no persistent Codex thread UI
- no raw approval, terminal, or app-server controls
- suggestion card before applying output

Because of that, Resumify should keep using a small local HTTP sidecar. The sidecar can use App Server internally for the installed local Codex harness, but the browser boundary should stay the same.

## Current Decision

Do not expose `codex app-server --listen ws://...` to the browser.

Reasons:

- App Server includes broad primitives such as threads, turns, shell commands, approvals, and streamed item events.
- The WebSocket transport is documented as experimental and unsupported.
- Non-loopback listeners require careful auth before exposure.
- Resume content is sensitive, so the browser should only see resume-safe endpoints.

Use `codex app-server --listen stdio://` inside the Node sidecar for local development AI. This gives us the official thread and turn lifecycle without giving the browser raw App Server access.

Keep `codex exec` as a fallback runner because App Server is still a deeper integration surface and local Codex installs may vary.

## What We Adopted

- Local loopback sidecar only.
- Resume-specific `health`, `models`, `runTask`, and redacted `recent-runs` endpoints.
- `readyz` and `healthz` compatibility probes.
- No raw prompts or resume text in sidecar debug responses.
- App Server stdio runner with one ephemeral thread and one turn per resume task.
- Read-only Codex execution inside an ephemeral temp directory.
- No turn network access for App Server tasks.
- `codex exec` fallback if App Server is unavailable.

## Revisit Criteria

Consider a richer App Server or Codex SDK integration if we need:

- streamed token or item progress in the UI
- long-running multi-turn resume coaching sessions
- resumable local AI conversations
- approval-style workflows
- richer local traces for agent actions

Even then, keep App Server or SDK behind the Node sidecar, not directly in the browser.
