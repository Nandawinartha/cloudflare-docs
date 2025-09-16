#!/usr/bin/env node
import process from 'node:process'

const token = process.env.CF_API_TOKEN
if (!token) {
  console.error('Set CF_API_TOKEN environment variable')
  process.exit(1)
}

const resp = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
  headers: { Authorization: `Bearer ${token}` }
})
const json = await resp.json()
console.log(JSON.stringify(json, null, 2))

if (!resp.ok || json.success !== true) process.exit(2)

