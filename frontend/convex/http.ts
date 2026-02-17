import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

function readServiceToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice("bearer ".length).trim() || null;
}

function isAuthorizedServiceCall(request: Request, expectedToken?: string): boolean {
  if (!expectedToken) return false;
  const token = readServiceToken(request);
  return Boolean(token && token === expectedToken);
}

http.route({
  path: "/mcp/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedToken = (globalThis as any).process?.env?.MCP_INGEST_TOKEN as
      | string
      | undefined;
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ error: "Missing MCP_INGEST_TOKEN on Convex deployment." }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    if (!isAuthorizedServiceCall(request, expectedToken)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const result = await ctx.runAction(internal.posts.ingestPromptEventWithRewriteInternal, {
      sessionId: String(payload.sessionId ?? ""),
      userId: payload.userId ? String(payload.userId) : undefined,
      githubUsername: String(payload.githubUsername ?? ""),
      timestamp: Number(payload.timestamp ?? Date.now()),
      promptLength: Number(payload.promptLength ?? 0),
      containsCodeBlock: Boolean(payload.containsCodeBlock ?? false),
      modelUsed: String(payload.modelUsed ?? "unknown"),
      retryIndex: Number(payload.retryIndex ?? 0),
      timeSinceLastPromptMs: Number(payload.timeSinceLastPromptMs ?? 0),
      aiEditSuggested: Boolean(payload.aiEditSuggested ?? false),
      aiEditAccepted: Boolean(payload.aiEditAccepted ?? false),
      manualOverride: Boolean(payload.manualOverride ?? false),
      linesAddedCount: Number(payload.linesAddedCount ?? 0),
      linesRemovedCount: Number(payload.linesRemovedCount ?? 0),
      repeatedPatternDetected: Boolean(payload.repeatedPatternDetected ?? false),
      highRetryRate: Boolean(payload.highRetryRate ?? false),
      microSummary: String(payload.microSummary ?? ""),
      markSessionCompleted: Boolean(payload.markSessionCompleted ?? false),
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "content-type": "application/json" },
    });
  }),
});

http.route({
  path: "/mcp/resolve-key",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedToken = (globalThis as any).process?.env?.MCP_INGEST_TOKEN as
      | string
      | undefined;
    if (!isAuthorizedServiceCall(request, expectedToken)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const apiKey = String(payload.api_key ?? "").trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "api_key is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const keyHash = await sha256(apiKey);
    const resolved = await ctx.runQuery(internal.apiKeys.resolveByHashInternal, {
      keyHash,
    });

    if (!resolved) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    await ctx.runMutation(internal.apiKeys.touchApiKeyInternal, {
      keyId: resolved.key._id,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        userId: String(resolved.key.userId),
        githubUsername:
          resolved.user.githubUsername ?? resolved.user.name ?? "unknown",
        gitEmail: resolved.user.email ?? "unknown@example.com",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }),
});

export default http;
