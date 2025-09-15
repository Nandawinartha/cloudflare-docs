export interface Env {
  TENANT_MAP: KVNamespace;
  USER_WORKERS: DispatchNamespace;
  DEFAULT_USER_ID: string;
}

async function resolveTenantForHost(env: Env, host: string): Promise<{ userId: string; metadata?: Record<string, unknown> } | null> {
  const key = `host:${host}`.toLowerCase();
  const value = await env.TENANT_MAP.get(key, { type: "json" });
  if (!value) return null;
  const { userId, metadata } = value as { userId: string; metadata?: Record<string, unknown> };
  if (!userId || typeof userId !== "string") return null;
  return { userId, metadata };
}

function notFound(message: string, status = 404): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.hostname;
    if (!host) return notFound("Missing Host header", 400);

    const tenant = (await resolveTenantForHost(env, host)) ?? { userId: env.DEFAULT_USER_ID };

    try {
      const userWorker = env.USER_WORKERS.get(tenant.userId);
      if (!userWorker) return notFound(`No user worker for tenant ${tenant.userId}`);

      const forwardedRequest = new Request(request, {
        headers: new Headers({
          ...Object.fromEntries(request.headers),
          "x-tenant-user": tenant.userId,
          "x-tenant-host": host,
        }),
      });

      return await userWorker.fetch(forwardedRequest);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return notFound(`Dispatch error: ${message}`, 502);
    }
  },
};

