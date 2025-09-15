#!/usr/bin/env node
// Build Next app with next-on-pages and deploy as a user worker
// Usage: CF_ACCOUNT_ID=... USER_WORKER_NAME=... node paas/scripts/deploy-next.mjs

import { execSync } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs'

const accountId = process.env.CF_ACCOUNT_ID
const userWorkerName = process.env.USER_WORKER_NAME || 'user-next-app'
if (!accountId) {
  console.error('Set CF_ACCOUNT_ID and optionally USER_WORKER_NAME')
  process.exit(1)
}

const templateDir = path.resolve(process.cwd())
const outDir = path.join(templateDir, '.vercel', 'output')

console.log('Building Next app...')
execSync('npm run build', { stdio: 'inherit', cwd: templateDir })
execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit', cwd: templateDir })

// next-on-pages outputs a worker at ./.vercel/output/static/_worker.js
const workerDir = path.join(outDir, 'static')
const workerFile = path.join(workerDir, '_worker.js')
if (!fs.existsSync(workerFile)) {
  console.error('Worker file not found at', workerFile)
  process.exit(2)
}

const toml = `name = "${userWorkerName}"
main = "_worker.js"
compatibility_date = "2024-11-20"
`;
fs.writeFileSync(path.join(workerDir, 'wrangler.toml'), toml)

console.log('Deploying user worker', userWorkerName)
execSync('npx wrangler deploy', { stdio: 'inherit', cwd: workerDir })

console.log('Deployed. Add mapping in TENANT_MAP and route via dispatcher.')

