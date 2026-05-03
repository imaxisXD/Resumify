# Codex Sidecar

The local Codex sidecar is a resume-only harness between the browser and the installed `codex` CLI.

It intentionally does not expose `codex app-server` directly. OpenAI's Codex App Server is a JSON-RPC protocol for deep rich-client integrations with threads, approvals, conversation history, and streamed agent events. Resumify only needs narrow resume-writing tasks, so the browser talks to a small HTTP sidecar that exposes resume-safe endpoints.

Internally, the sidecar now uses `codex app-server --listen stdio://` by default. It starts one ephemeral Codex thread, sends one resume task turn, collects the final assistant answer, and returns it as a reviewable suggestion. If App Server fails, it falls back to `codex exec` unless `RESUMIFY_CODEX_APP_SERVER_STRICT=1` is set.

## Commands

Run app plus sidecar:

```bash
npm run dev:ai
```

Run only the sidecar:

```bash
npm run ai:codex-sidecar
```

Default URL:

```text
http://127.0.0.1:4317
```

Optional runner controls:

```bash
RESUMIFY_CODEX_TRANSPORT=exec npm run ai:codex-sidecar
RESUMIFY_CODEX_APP_SERVER_STRICT=1 npm run ai:codex-sidecar
```

## Endpoints

- `GET /health`: verifies the sidecar and installed `codex` CLI.
- `GET /readyz`: lightweight local readiness probe.
- `GET /healthz`: lightweight local health probe; requests with an `Origin` header are rejected.
- `GET /models`: returns supported local model ids.
- `POST /runTask`: runs one resume AI task through Codex.
- `GET /recent-runs`: returns redacted metadata for recent sidecar runs.

`/recent-runs` must not return raw prompt text, resume content, job descriptions, or generated resume output. It is for debugging whether Codex ran, how long it took, which model was used, and whether a fallback-worthy error occurred.

## Safety Boundary

The browser must never receive raw filesystem, shell, or app-server controls. It may only call resume-safe endpoints exposed by the sidecar.

Codex runs in an ephemeral temp directory with read-only sandboxing and no turn network access. The prompt is sent as a single App Server turn; streamed agent-message deltas are collected inside Node and only the final text is returned to the browser. The temp directory is deleted after the task.

The fallback `codex exec` runner uses the same ephemeral temp directory and read-only sandbox. The prompt is streamed into `codex exec`; output is read from `last-message.txt`, returned to the browser, then the temp directory is deleted.

The sidecar binds to `127.0.0.1` by default and refuses non-loopback hosts unless `RESUMIFY_CODEX_ALLOW_REMOTE=1` is set. Keep it on loopback for normal development.

Only loopback browser origins are allowed by CORS. This is narrower than a general app-server integration and is deliberate because resume text is sensitive.

## Debug Checklist

If AI appears inactive:

1. Confirm the top bar says `Codex ready`.
2. Check `GET /health`.
3. Check `GET /recent-runs` after clicking an AI action.
4. Confirm the run `transport` is `app-server`. If it says `exec`, check `fallbackReason`.
5. If `status` is `error`, inspect the redacted error message.
6. Restart the sidecar after code changes because existing processes keep old behavior.
