#!/usr/bin/env node
import { spawn } from 'node:child_process'

const children = new Set()
let shuttingDown = false

const ai = start('ai', ['run', 'ai:codex-sidecar'], { restart: true })
const app = start('app', ['run', 'dev'], { keepAlive: true })

function start(label, args, options) {
  const child = spawn('npm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
  children.add(child)

  child.stdout.on('data', (chunk) => write(label, chunk))
  child.stderr.on('data', (chunk) => write(label, chunk))
  child.on('error', (error) => {
    console.error(`[${label}] ${error.message}`)
  })
  child.on('close', (code) => {
    children.delete(child)
    if (shuttingDown) return
    if (options.restart) {
      const suffix = code ? ` after exit code ${code}` : ''
      console.error(`[${label}] stopped${suffix}; restarting...`)
      setTimeout(() => {
        if (!shuttingDown) start(label, args, options)
      }, 1500)
      return
    }
    if (options.keepAlive) {
      shutdown(code || 0)
      return
    }
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}; the app will keep running.`)
    }
  })

  return child
}

function write(label, chunk) {
  const lines = String(chunk).split(/\r?\n/)
  for (const line of lines) {
    if (line.trim()) console.log(`[${label}] ${line}`)
  }
}

function shutdown(code) {
  shuttingDown = true
  for (const child of children) {
    child.kill('SIGTERM')
  }
  process.exitCode = code
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

void ai
void app
