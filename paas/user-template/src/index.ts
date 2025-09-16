export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userId = request.headers.get("x-tenant-user") || "unknown";
    const host = request.headers.get("x-tenant-host") || url.hostname;
    if (url.pathname === "/kv") {
      return new Response("OK");
    }
    if (url.pathname === "/db/init") {
      await env.DB.exec(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, msg TEXT, created_at TEXT);`);
      return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    }
    if (url.pathname === "/db/add" && request.method === "POST") {
      const body = await request.json().catch(() => ({ msg: "hello" }));
      const msg = String(body.msg ?? "hello");
      const createdAt = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO messages (user_id, msg, created_at) VALUES (?1, ?2, ?3)`).bind(userId, msg, createdAt).run();
      return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    }
    if (url.pathname === "/db/list") {
      const { results } = await env.DB.prepare(`SELECT id, user_id, msg, created_at FROM messages WHERE user_id = ?1 ORDER BY id DESC LIMIT 50`).bind(userId).all();
      return new Response(JSON.stringify(results), { headers: { "content-type": "application/json" } });
    }
    if (url.pathname.startsWith("/r2/put/") && request.method === "PUT") {
      const key = `${userId}/${decodeURIComponent(url.pathname.slice("/r2/put/".length))}`;
      await env.BUCKET.put(key, request.body);
      return new Response(JSON.stringify({ ok: true, key }), { headers: { "content-type": "application/json" } });
    }
    if (url.pathname.startsWith("/r2/get/") && request.method === "GET") {
      const key = `${userId}/${decodeURIComponent(url.pathname.slice("/r2/get/".length))}`;
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response("Not Found", { status: 404 });
      return new Response(obj.body, { headers: obj.httpMetadata ? { 'content-type': obj.httpMetadata.contentType ?? 'application/octet-stream' } : undefined });
    }
    return new Response(
      JSON.stringify({
        message: "Hello from user worker",
        userId,
        host,
        path: url.pathname,
        routes: ["/db/init", "/db/add (POST {msg})", "/db/list", "/r2/put/{key}", "/r2/get/{key}"],
      }),
      { headers: { "content-type": "application/json" } }
    );
  },
};

