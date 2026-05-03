#!/usr/bin/env node
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const port = Number(process.env.RESUMIFY_CODEX_PORT || 4317)
const host = process.env.RESUMIFY_CODEX_HOST || '127.0.0.1'
const codexTransport = process.env.RESUMIFY_CODEX_TRANSPORT || 'app-server'
const recentRuns = []
let takeoverTimer = null

if (!isLoopbackHost(host) && process.env.RESUMIFY_CODEX_ALLOW_REMOTE !== '1') {
  console.error(`Refusing to start Codex sidecar on non-loopback host "${host}".`)
  console.error('Use 127.0.0.1 or localhost, or set RESUMIFY_CODEX_ALLOW_REMOTE=1 only for a trusted network.')
  process.exit(1)
}

const server = createServer(async (req, res) => {
  const origin = allowedOrigin(req.headers.origin)
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (origin && req.headers['access-control-request-private-network'] === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  try {
    if (req.method === 'GET' && (req.url === '/readyz' || req.url === '/healthz')) {
      if (req.url === '/healthz' && req.headers.origin) return sendJson(res, 403, { error: 'Forbidden.' })
      return sendJson(res, 200, { ok: true })
    }
    if (req.method === 'GET' && req.url === '/health') {
      const version = await runText('codex', ['--version'], '')
      return sendJson(res, 200, { ok: true, version: version.trim(), transport: codexTransport })
    }
    if (req.method === 'GET' && req.url === '/models') {
      return sendJson(res, 200, {
        ok: true,
        models: ['gpt-5.4-mini', 'gpt-5.4', 'gpt-5.3-codex'],
      })
    }
    if (req.method === 'GET' && req.url === '/recent-runs') {
      return sendJson(res, 200, {
        ok: true,
        runs: recentRuns,
      })
    }
    if (req.method === 'POST' && req.url === '/runTask') {
      const body = await readJson(req)
      const prompt = String(body.prompt || '').trim()
      const model = String(body.model || 'gpt-5.4-mini').trim()
      if (!prompt) return sendJson(res, 400, { error: 'Missing prompt.' })
      const run = beginRun(prompt, model)
      try {
        const result = await runCodex(prompt, model)
        finishRun(run, {
          status: 'ok',
          responseChars: result.text.length,
          transport: result.transport,
          fallbackFrom: result.fallbackFrom,
          fallbackReason: result.fallbackReason,
        })
        return sendJson(res, 200, { text: result.text, transport: result.transport })
      } catch (error) {
        finishRun(run, { status: 'error', error: safeError(error) })
        throw error
      }
    }
    return sendJson(res, 404, { error: 'Not found.' })
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Codex sidecar failed.' })
  }
})

listen()

server.on('error', async (error) => {
  if (error && error.code === 'EADDRINUSE') {
    const existing = await getExistingSidecarHealth()
    if (existing?.ok) {
      console.log(`Resumify Codex sidecar already running on http://${host}:${port}`)
      if (existing.version) console.log(`Detected ${existing.version}`)
      waitForTakeover()
      return
    }

    console.error(`Port ${host}:${port} is already in use by another process.`)
    console.error('Stop that process or set RESUMIFY_CODEX_PORT to another local port.')
    process.exit(1)
  }

  console.error(error instanceof Error ? error.message : 'Codex sidecar failed to start.')
  process.exit(1)
})

function listen() {
  if (takeoverTimer) {
    clearInterval(takeoverTimer)
    takeoverTimer = null
  }
  server.listen(port, host, () => {
    console.log(`Resumify Codex sidecar listening on http://${host}:${port}`)
  })
}

function waitForTakeover() {
  if (takeoverTimer) return
  takeoverTimer = setInterval(async () => {
    const existing = await getExistingSidecarHealth()
    if (existing?.ok) return
    console.log(`Existing sidecar stopped; taking over http://${host}:${port}`)
    listen()
  }, 2500)
}

async function runCodex(prompt, model) {
  if (codexTransport === 'exec') {
    return {
      text: await runCodexExec(prompt, model),
      transport: 'exec',
    }
  }

  try {
    return {
      text: await runCodexAppServer(prompt, model),
      transport: 'app-server',
    }
  } catch (error) {
    if (process.env.RESUMIFY_CODEX_APP_SERVER_STRICT === '1') throw error
    return {
      text: await runCodexExec(prompt, model),
      transport: 'exec',
      fallbackFrom: 'app-server',
      fallbackReason: safeError(error),
    }
  }
}

async function runCodexAppServer(prompt, model) {
  const dir = await mkdtemp(join(tmpdir(), 'resumify-codex-'))
  try {
    return await runCodexAppServerInDir(prompt, model, dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function runCodexAppServerInDir(prompt, model, dir) {
  return new Promise((resolve, reject) => {
    const child = spawn('codex', ['app-server', '--listen', 'stdio://'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const pending = new Map()
    let requestId = 0
    let stdoutBuffer = ''
    let stderr = ''
    let finalText = ''
    let settled = false

    const timer = setTimeout(() => {
      fail(new Error('Codex app-server timed out.'))
    }, 120_000)

    const cleanup = () => {
      clearTimeout(timer)
      if (!child.killed) child.kill('SIGTERM')
    }

    const fail = (error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const done = () => {
      if (settled) return
      const text = finalText.trim()
      if (!text) {
        fail(new Error('Codex app-server completed without a final answer.'))
        return
      }
      settled = true
      cleanup()
      resolve(text)
    }

    const request = (method, params) =>
      new Promise((requestResolve, requestReject) => {
        const id = ++requestId
        pending.set(id, { resolve: requestResolve, reject: requestReject })
        child.stdin.write(`${JSON.stringify({ id, method, params })}\n`)
      })

    const notifyInitialized = () => {
      child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`)
    }

    const handleMessage = (message) => {
      if (message.id && pending.has(message.id)) {
        const pendingRequest = pending.get(message.id)
        pending.delete(message.id)
        if (message.error) pendingRequest.reject(new Error(message.error.message || JSON.stringify(message.error)))
        else pendingRequest.resolve(message.result)
        return
      }

      if (message.method === 'item/agentMessage/delta') {
        finalText += message.params?.delta || ''
        return
      }

      if (message.method === 'item/completed' && message.params?.item?.type === 'agentMessage') {
        const item = message.params.item
        if (item.phase === 'final_answer' || !item.phase) finalText = item.text || finalText
        return
      }

      if (message.method === 'turn/completed') {
        const turn = message.params?.turn
        if (turn?.status === 'failed') {
          fail(new Error(turn.error?.message || 'Codex app-server turn failed.'))
          return
        }
        if (turn?.status === 'completed') done()
        return
      }

      if (message.method === 'error') {
        fail(new Error(message.params?.message || 'Codex app-server reported an error.'))
      }
    }

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk
      const lines = stdoutBuffer.split('\n')
      stdoutBuffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          handleMessage(JSON.parse(line))
        } catch (error) {
          fail(new Error(`Invalid Codex app-server message: ${error instanceof Error ? error.message : 'parse failed'}`))
        }
      }
    })

    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4_000)
    })

    child.on('error', fail)
    child.on('close', (code) => {
      if (!settled) {
        fail(new Error(stderr.trim() || `Codex app-server exited with code ${code}.`))
      }
    })

    ;(async () => {
      try {
        await request('initialize', {
          clientInfo: {
            name: 'resumify',
            title: 'Resumify',
            version: '0.0.0',
          },
          capabilities: {
            experimentalApi: true,
            optOutNotificationMethods: [
              'account/rateLimits/updated',
              'mcpServer/startupStatus/updated',
              'remoteControl/status/changed',
              'thread/status/changed',
              'thread/tokenUsage/updated',
              'warning',
            ],
          },
        })
        notifyInitialized()
        const thread = await request('thread/start', {
          cwd: dir,
          model,
          approvalPolicy: 'never',
          approvalsReviewer: 'user',
          sandbox: 'read-only',
          ephemeral: true,
          serviceName: 'Resumify',
          baseInstructions:
            'You are Resumify AI. Help only with resume writing and resume analysis. Return only the requested final answer. Do not run shell commands, edit files, inspect files, or browse the web.',
        })
        await request('turn/start', {
          threadId: thread.thread.id,
          input: [{ type: 'text', text: prompt }],
          cwd: dir,
          model,
          approvalPolicy: 'never',
          approvalsReviewer: 'user',
          sandboxPolicy: { type: 'readOnly', networkAccess: false },
          effort: 'low',
          personality: 'pragmatic',
        })
      } catch (error) {
        fail(error instanceof Error ? error : new Error('Codex app-server request failed.'))
      }
    })()
  })
}

async function runCodexExec(prompt, model) {
  const dir = await mkdtemp(join(tmpdir(), 'resumify-codex-'))
  const output = join(dir, 'last-message.txt')
  try {
    await runText(
      'codex',
      [
        'exec',
        '--ephemeral',
        '--skip-git-repo-check',
        '--sandbox',
        'read-only',
        '--cd',
        dir,
        '--model',
        model,
        '--output-last-message',
        output,
        '-',
      ],
      prompt,
      120_000,
    )
    return (await readFile(output, 'utf8')).trim()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function beginRun(prompt, model) {
  const run = {
    id: `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'running',
    taskKind: classifyPrompt(prompt),
    model,
    preferredTransport: codexTransport,
    promptChars: prompt.length,
    startedAt: new Date().toISOString(),
  }
  recentRuns.unshift(run)
  recentRuns.splice(25)
  return run
}

function finishRun(run, patch) {
  const completedAt = new Date()
  Object.assign(run, patch, {
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - Date.parse(run.startedAt),
  })
}

function classifyPrompt(prompt) {
  const match = prompt.match(/"kind"\s*:\s*"([^"]+)"/)
  if (match?.[1]) return match[1]
  if (prompt.includes('reviewing one resume bullet')) return 'bullet-quality'
  return 'unknown'
}

function safeError(error) {
  const message = error instanceof Error ? error.message : 'Codex sidecar failed.'
  return message.slice(0, 240)
}

function runText(command, args, input, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('Codex command timed out.'))
    }, timeoutMs)
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim() || `Codex exited with code ${code}.`))
    })
    child.stdin.end(input)
  })
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(status === 204 ? undefined : JSON.stringify(data))
}

async function getExistingSidecarHealth() {
  try {
    const response = await fetch(`http://${host}:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

function allowedOrigin(origin) {
  if (!origin) return `http://localhost:${port}`
  try {
    const url = new URL(origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    if (isLoopbackHost(url.hostname)) return origin
  } catch {
    return ''
  }
  return ''
}

function isLoopbackHost(value) {
  return value === 'localhost' || value === '127.0.0.1' || value === '::1' || value === '[::1]'
}
