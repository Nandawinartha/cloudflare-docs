#!/usr/bin/env node
// Create a Custom Hostname (SSL for SaaS) for a tenant domain
// Usage: CF_API_TOKEN=... CF_ZONE_ID=... node scripts/saas-onboard.mjs <hostname>

import process from 'node:process'

const token = process.env.CF_API_TOKEN
const zoneId = process.env.CF_ZONE_ID
const hostname = process.argv[2]

if (!token || !zoneId || !hostname) {
  console.error('Usage: CF_API_TOKEN=... CF_ZONE_ID=... node scripts/saas-onboard.mjs <hostname>')
  process.exit(1)
}

const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`
const body = {
  hostname,
  ssl: {
    method: 'http', // or 'txt' for DNS validation
    type: 'dv',
    settings: { http2: 'on', tls_1_3: 'on' }
  }
}

const resp = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})

const json = await resp.json()
if (!resp.ok || !json.success) {
  console.error('Failed to create custom hostname', JSON.stringify(json, null, 2))
  process.exit(2)
}

console.log(JSON.stringify(json, null, 2))

