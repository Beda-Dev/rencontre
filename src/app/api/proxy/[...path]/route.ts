import { NextRequest, NextResponse } from "next/server";

// Same-origin proxy for the "real API" mode (see lib/config.ts /
// lib/api.ts). The browser only ever talks to this route (same origin as
// the app, so no CORS/preflight involved); this server-side handler then
// forwards to whatever backend the user configured in /settings/connection
// — CORS rules don't apply to server-to-server requests, only to requests
// made from a browser page.
//
// The target backend is *not* baked in at build time: the client sends it
// on every request via the X-Proxy-Target header (read from the runtime
// config, which can be overridden from the UI without a redeploy).

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "x-proxy-target",
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

async function handle(req: NextRequest, path: string[]): Promise<NextResponse> {
  const target = req.headers.get("x-proxy-target");
  if (!target) {
    return NextResponse.json(
      { error: "Missing X-Proxy-Target header — set an API base URL in /settings/connection." },
      { status: 400 }
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(`${target.replace(/\/$/, "")}/${path.join("/")}`);
  } catch {
    return NextResponse.json({ error: "Invalid X-Proxy-Target URL" }, { status: 400 });
  }
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by undici when forwarding a streamed (ReadableStream) body.
      // @ts-expect-error -- `duplex` isn't in the lib.dom RequestInit type yet.
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { error: `Could not reach ${targetUrl.origin}` },
      { status: 502 }
    );
  }

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
