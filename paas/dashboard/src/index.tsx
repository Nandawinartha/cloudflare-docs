import { Hono } from 'hono'

export interface Env {
  CONTROL_API_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', c => c.html(`
<!doctype html>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PaaS Dashboard</title>
<style>
  body{font-family:system-ui, sans-serif; max-width:880px; margin:40px auto; padding:0 16px}
  input,button{font-size:16px; padding:8px; margin:4px}
  code{background:#f5f5f5; padding:2px 4px}
  .card{border:1px solid #ddd; padding:16px; border-radius:8px; margin-bottom:12px}
  .row{display:flex; gap:8px; flex-wrap:wrap}
</style>
<h1>PaaS Dashboard</h1>
<div class="card">
  <h2>Create tenant mapping</h2>
  <div class="row">
    <input id="hostname" placeholder="hostname (customer.example.com)" />
    <input id="userId" placeholder="userId (worker name)" />
    <button onclick="createTenant()">Create</button>
  </div>
  <pre id="result"></pre>
</div>

<div class="card">
  <h2>Create Custom Hostname (SSL for SaaS)</h2>
  <div class="row">
    <input id="saasHostname" placeholder="hostname (customer.example.com)" />
    <input id="token" placeholder="CF API Token (Bearer)" />
    <select id="method"><option value="http">http</option><option value="txt">txt</option></select>
    <button onclick="createCH()">Create CH</button>
  </div>
  <pre id="saasRes"></pre>
</div>

<div class="card">
  <h2>Deploy Next.js tenant app</h2>
  <ol>
    <li>Open terminal in <code>paas/next-template</code></li>
    <li>Run <code>npm install</code></li>
    <li>Run <code>CF_ACCOUNT_ID=... USER_WORKER_NAME=&lt;userId&gt; node ../scripts/deploy-next.mjs</code></li>
    <li>Create tenant mapping to that <code>userId</code> above</li>
  </ol>
</div>

<script>
const BASE = ${JSON.stringify(c.env.CONTROL_API_URL)}
async function createTenant(){
  const hostname = document.getElementById('hostname').value
  const userId = document.getElementById('userId').value
  const r = await fetch(new URL('/tenants', BASE), {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({hostname, userId})})
  document.getElementById('result').textContent = JSON.stringify(await r.json(), null, 2)
}
async function createCH(){
  const hostname = document.getElementById('saasHostname').value
  const token = document.getElementById('token').value
  const method = document.getElementById('method').value
  const r = await fetch(new URL('/saas/custom-hostnames', BASE), {method:'POST', headers:{'content-type':'application/json', 'authorization': 'Bearer '+token}, body: JSON.stringify({hostname, method})})
  document.getElementById('saasRes').textContent = JSON.stringify(await r.json(), null, 2)
}
</script>
`))

export default app

