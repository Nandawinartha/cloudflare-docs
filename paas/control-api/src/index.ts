export interface Env {
  TENANT_MAP: KVNamespace;
}

type TenantRecord = {
  userId: string;
  metadata?: Record<string, unknown>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function bad(msg: string, status = 400) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/health") return json({ ok: true });

    if (pathname === "/tenants" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as
        | { hostname?: string; userId?: string; metadata?: Record<string, unknown> }
        | null;
      if (!body || !body.hostname || !body.userId) return bad("hostname and userId required");
      const key = `host:${body.hostname.toLowerCase()}`;
      const record: TenantRecord = { userId: body.userId, metadata: body.metadata };
      await env.TENANT_MAP.put(key, JSON.stringify(record));
      return json({ ok: true, hostname: body.hostname, userId: body.userId });
    }

    if (pathname.startsWith("/tenants/") && request.method === "PUT") {
      const hostname = decodeURIComponent(pathname.substring("/tenants/".length)).toLowerCase();
      const body = (await request.json().catch(() => null)) as
        | { userId?: string; metadata?: Record<string, unknown> }
        | null;
      if (!body) return bad("invalid json");
      const key = `host:${hostname}`;
      const existing = (await env.TENANT_MAP.get(key, { type: "json" })) as TenantRecord | null;
      if (!existing) return bad("tenant not found", 404);
      const updated: TenantRecord = {
        userId: body.userId ?? existing.userId,
        metadata: body.metadata ?? existing.metadata,
      };
      await env.TENANT_MAP.put(key, JSON.stringify(updated));
      return json({ ok: true, hostname, userId: updated.userId });
    }

    if (pathname.startsWith("/tenants/") && request.method === "GET") {
      const hostname = decodeURIComponent(pathname.substring("/tenants/".length)).toLowerCase();
      const key = `host:${hostname}`;
      const existing = (await env.TENANT_MAP.get(key, { type: "json" })) as TenantRecord | null;
      if (!existing) return bad("tenant not found", 404);
      return json({ hostname, ...existing });
    }

    if (pathname.startsWith("/tenants/") && request.method === "DELETE") {
      const hostname = decodeURIComponent(pathname.substring("/tenants/".length)).toLowerCase();
      const key = `host:${hostname}`;
      await env.TENANT_MAP.delete(key);
      return json({ ok: true, hostname });
    }

    return bad("not found", 404);
  },
};

