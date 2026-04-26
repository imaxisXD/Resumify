import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#': srcPath,
      '@': srcPath,
    },
  },
  test: {
    environment: 'jsdom',
  },
})
