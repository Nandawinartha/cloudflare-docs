#!/usr/bin/env node
// Small CLI to call the control API for tenant CRUD
// Usage:
//   node scripts/tenant-crud.mjs <baseUrl> create <hostname> <userId> [metadataJson]
//   node scripts/tenant-crud.mjs <baseUrl> get <hostname>
//   node scripts/tenant-crud.mjs <baseUrl> update <hostname> <userId?> [metadataJson]
//   node scripts/tenant-crud.mjs <baseUrl> delete <hostname>

import process from 'node:process'

const [baseUrl, cmd, p1, p2, p3] = process.argv.slice(2)
if (!baseUrl || !cmd) {
  console.error('Usage: node scripts/tenant-crud.mjs <baseUrl> <cmd> ...')
  process.exit(1)
}

async function main() {
  if (cmd === 'create') {
    const hostname = p1
    const userId = p2
    const metadata = p3 ? JSON.parse(p3) : undefined
    const r = await fetch(new URL('/tenants', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostname, userId, metadata })
    })
    console.log(await r.json())
    process.exit(r.ok ? 0 : 2)
  }
  if (cmd === 'get') {
    const hostname = p1
    const r = await fetch(new URL(`/tenants/${encodeURIComponent(hostname)}`, baseUrl))
    console.log(await r.json())
    process.exit(r.ok ? 0 : 2)
  }
  if (cmd === 'update') {
    const hostname = p1
    const userId = p2 !== 'null' ? p2 : undefined
    const metadata = p3 ? JSON.parse(p3) : undefined
    const r = await fetch(new URL(`/tenants/${encodeURIComponent(hostname)}`, baseUrl), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, metadata })
    })
    console.log(await r.json())
    process.exit(r.ok ? 0 : 2)
  }
  if (cmd === 'delete') {
    const hostname = p1
    const r = await fetch(new URL(`/tenants/${encodeURIComponent(hostname)}`, baseUrl), { method: 'DELETE' })
    console.log(await r.json())
    process.exit(r.ok ? 0 : 2)
  }
  console.error('Unknown cmd')
  process.exit(1)
}

await main()

