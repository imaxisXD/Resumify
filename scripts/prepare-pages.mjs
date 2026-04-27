import { copyFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'dist', 'client')
const shellPath = join(outDir, '_shell.html')
const indexPath = join(outDir, 'index.html')

await stat(shellPath)
await copyFile(shellPath, indexPath)
