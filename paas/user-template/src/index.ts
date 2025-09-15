export interface Env {}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = request.headers.get("x-tenant-user") || "unknown";
    const host = request.headers.get("x-tenant-host") || url.hostname;
    return new Response(
      JSON.stringify({
        message: "Hello from user worker",
        userId,
        host,
        path: url.pathname,
      }),
      { headers: { "content-type": "application/json" } }
    );
  },
};

