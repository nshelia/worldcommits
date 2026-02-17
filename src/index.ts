import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type Env = Cloudflare.Env & {
  MCP_SHARED_SECRET: string;
  CONVEX_SITE_URL?: string;
  CONVEX_INGEST_TOKEN?: string;
};

type ResolvedIdentity = {
  userId: string;
  githubUsername: string;
  gitEmail: string;
};

const COMPLETION_TYPES = [
  "clarifying_question",
  "plan",
  "plan_succeeded",
  "changes_made",
  "answer_only",
  "error",
] as const;

const COMPLETION_STATUSES = ["completed", "failed"] as const;

const completionPayloadSchema = z.object({
  event_id: z
    .string()
    .min(8)
    .max(128)
    .optional()
    .describe("Unique event id from client for idempotency."),
  api_key: z.string().min(20).max(256),
  completion_type: z.enum(COMPLETION_TYPES),
  completion_status: z.enum(COMPLETION_STATUSES).default("completed"),
  completion_word_count: z.number().int().nonnegative(),
  files_edited_count: z.number().int().nonnegative().default(0),
  files_edited: z.array(z.string().min(1).max(300)).max(500).default([]),
  project: z.string().max(120).optional(),
  client: z.string().max(120).optional(),
  prompt_summary: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "A 2-3 sentence summary of the latest user prompt that triggered this completion.",
    ),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .default({}),
});

async function forwardToConvex(
  env: Env,
  eventId: string,
  identity: ResolvedIdentity,
  parsed: z.infer<typeof completionPayloadSchema>,
): Promise<void> {
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_TOKEN) return;

  const url = `${env.CONVEX_SITE_URL}/mcp/ingest`;
  const isCompleted =
    parsed.completion_status === "completed" &&
    (parsed.completion_type === "changes_made" ||
      parsed.completion_type === "plan_succeeded");

  const body = {
    sessionId: eventId,
    userId: identity.userId,
    githubUsername: identity.githubUsername,
    timestamp: Date.now(),
    promptLength: parsed.completion_word_count,
    containsCodeBlock: parsed.files_edited.length > 0,
    modelUsed: parsed.client ?? "unknown",
    retryIndex: 0,
    timeSinceLastPromptMs: 0,
    aiEditSuggested: parsed.files_edited_count > 0,
    aiEditAccepted: parsed.completion_type === "changes_made",
    manualOverride: false,
    linesAddedCount: parsed.files_edited_count,
    linesRemovedCount: 0,
    repeatedPatternDetected: false,
    highRetryRate: parsed.completion_status === "failed",
    microSummary: parsed.prompt_summary,
    markSessionCompleted: isCompleted,
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.CONVEX_INGEST_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.error(
        `Convex ingest failed: ${resp.status} ${await resp.text()}`,
      );
    }
  } catch (err) {
    console.error("Convex ingest error:", err);
  }
}

async function resolveApiKey(
  env: Env,
  apiKey: string,
): Promise<ResolvedIdentity> {
  if (!env.CONVEX_SITE_URL || !env.CONVEX_INGEST_TOKEN) {
    throw new Error(
      "Convex key resolution is not configured. Missing CONVEX_SITE_URL or CONVEX_INGEST_TOKEN.",
    );
  }

  const resp = await fetch(`${env.CONVEX_SITE_URL}/mcp/resolve-key`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CONVEX_INGEST_TOKEN}`,
    },
    body: JSON.stringify({ api_key: apiKey }),
  });
  xamp;

  if (!resp.ok) {
    throw new Error(`API key validation failed (${resp.status}).`);
  }

  const payload = (await resp.json()) as Partial<ResolvedIdentity> & {
    ok?: boolean;
  };
  if (
    !payload.ok ||
    typeof payload.userId !== "string" ||
    typeof payload.githubUsername !== "string" ||
    typeof payload.gitEmail !== "string"
  ) {
    throw new Error("Invalid identity response from Convex.");
  }
  return {
    userId: payload.userId,
    githubUsername: payload.githubUsername,
    gitEmail: payload.gitEmail,
  };
}

export class CompletionMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "worldcommits-completion-logger",
    version: "1.0.0",
  });

  async init() {
    this.server.tool(
      "save",
      "Persist a final completion event to analytics storage.",
      {
        event_id: z
          .string()
          .min(8)
          .max(128)
          .optional()
          .describe("Use a deterministic id to deduplicate retries."),
        api_key: z
          .string()
          .min(20)
          .max(256)
          .describe(
            "Required API key generated in the Worldcommits UI after GitHub sign-in. This key identifies and verifies the user.",
          ),
        completion_type: z.enum(COMPLETION_TYPES),
        completion_status: z.enum(COMPLETION_STATUSES).default("completed"),
        completion_word_count: z.number().int().nonnegative(),
        files_edited_count: z.number().int().nonnegative().default(0),
        files_edited: z.array(z.string().min(1).max(300)).max(500).default([]),
        project: z.string().max(120).optional(),
        client: z.string().max(120).optional(),
        prompt_summary: z
          .string()
          .min(1)
          .max(500)
          .describe(
            "Required. A 2-3 sentence summary of the latest user prompt that triggered this completion. Should describe what the user asked for without including code or secrets.",
          ),
        metadata: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.null()]),
          )
          .default({}),
      },
      async (input) => {
        const parsed = completionPayloadSchema.parse(input);
        const eventId = parsed.event_id ?? crypto.randomUUID();
        const runtimeEnv = (this as unknown as { env: Env }).env;
        const identity = await resolveApiKey(runtimeEnv, parsed.api_key);

        const result = await runtimeEnv.ANALYTICS_DB.prepare(
          `
            INSERT INTO completion_events (
              event_id,
              git_user,
              git_email,
              completion_type,
              completion_status,
              completion_word_count,
              files_edited_count,
              files_edited_json,
              project,
              client,
              prompt_summary,
              metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(event_id) DO NOTHING
          `,
        )
          .bind(
            eventId,
            identity.githubUsername,
            identity.gitEmail,
            parsed.completion_type,
            parsed.completion_status,
            parsed.completion_word_count,
            parsed.files_edited_count,
            JSON.stringify(parsed.files_edited),
            parsed.project ?? null,
            parsed.client ?? null,
            parsed.prompt_summary,
            JSON.stringify(parsed.metadata),
          )
          .run();

        const inserted = (result.meta.changes ?? 0) > 0;

        if (inserted) {
          const convexPromise = forwardToConvex(
            runtimeEnv,
            eventId,
            identity,
            parsed,
          );
          try {
            (this as unknown as { ctx: ExecutionContext }).ctx.waitUntil(
              convexPromise,
            );
          } catch {
            await convexPromise;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ok: true,
                inserted,
                event_id: eventId,
                completion_type: parsed.completion_type,
              }),
            },
          ],
        };
      },
    );
  }
}

const mcpHandler = CompletionMCP.serve("/mcp");

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function withCorsHeaders(headers: Record<string, string> = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    ...headers,
  };
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [scheme, token] = auth.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function isAuthorizedMcpCall(request: Request, env: Env): boolean {
  const token = getBearerToken(request);
  return Boolean(
    token && env.MCP_SHARED_SECRET && token === env.MCP_SHARED_SECRET,
  );
}

function parsePaginationParams(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? "25") || 25;
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

function getTimeRangeSql(timeRange: string): string | null {
  switch (timeRange) {
    case "today":
      return "date(created_at) = date('now')";
    case "week":
      return "created_at >= date('now', 'weekday 0', '-6 days')";
    case "month":
      return "created_at >= date('now', 'start of month')";
    default:
      return null;
  }
}

async function getUsersStats(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { page, pageSize, offset } = parsePaginationParams(url);

  const sortByParam = (url.searchParams.get("sortBy") ?? "words").toLowerCase();
  const sortByMap: Record<string, string> = {
    words: "total_words",
    events: "events_count",
    changes: "changes_made_count",
    files: "files_edited_total",
  };
  const sortBy = sortByMap[sortByParam] ?? "total_words";

  const orderParam = (url.searchParams.get("order") ?? "desc").toLowerCase();
  const order = orderParam === "asc" ? "ASC" : "DESC";

  const timeRange = (url.searchParams.get("timeRange") ?? "all").toLowerCase();
  const timeFilter = getTimeRangeSql(timeRange);
  const whereClause = timeFilter ? `WHERE ${timeFilter}` : "";

  const usersQuery = `
    SELECT
      git_user,
      git_email,
      COUNT(*) AS events_count,
      COALESCE(SUM(completion_word_count), 0) AS total_words,
      COALESCE(SUM(CASE WHEN completion_type = 'changes_made' THEN 1 ELSE 0 END), 0) AS changes_made_count,
      COALESCE(SUM(files_edited_count), 0) AS files_edited_total,
      MAX(created_at) AS last_event_at
    FROM completion_events
    ${whereClause}
    GROUP BY git_user, git_email
    ORDER BY ${sortBy} ${order}, git_email ASC
    LIMIT ? OFFSET ?
  `;

  const usersResult = await env.ANALYTICS_DB.prepare(usersQuery)
    .bind(pageSize, offset)
    .all();
  const countResult = await env.ANALYTICS_DB.prepare(
    `SELECT COUNT(*) AS total FROM (SELECT 1 FROM completion_events ${whereClause} GROUP BY git_user, git_email)`,
  ).first<{ total: number }>();

  return json(
    {
      page,
      pageSize,
      total: countResult?.total ?? 0,
      items: usersResult.results,
      sortBy: sortByParam,
      order: order.toLowerCase(),
      timeRange,
    },
    200,
    withCorsHeaders(),
  );
}

async function getEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { page, pageSize, offset } = parsePaginationParams(url);

  const gitEmail = url.searchParams.get("git_email")?.trim() || null;
  const gitUser = url.searchParams.get("git_user")?.trim() || null;

  const filters: string[] = [];
  const values: unknown[] = [];

  if (gitEmail) {
    filters.push("git_email = ?");
    values.push(gitEmail);
  }
  if (gitUser) {
    filters.push("git_user = ?");
    values.push(gitUser);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const eventsQuery = `
    SELECT
      id,
      event_id,
      git_user,
      git_email,
      completion_type,
      completion_status,
      completion_word_count,
      files_edited_count,
      files_edited_json,
      project,
      client,
      prompt_summary,
      metadata_json,
      created_at
    FROM completion_events
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) AS total FROM completion_events ${whereClause}`;

  const eventsResult = await env.ANALYTICS_DB.prepare(eventsQuery)
    .bind(...values, pageSize, offset)
    .all();
  const countResult = await env.ANALYTICS_DB.prepare(countQuery)
    .bind(...values)
    .first<{ total: number }>();

  return json(
    {
      page,
      pageSize,
      total: countResult?.total ?? 0,
      items: eventsResult.results,
    },
    200,
    withCorsHeaders(),
  );
}

async function getSummary(env: Env): Promise<Response> {
  const summary = await env.ANALYTICS_DB.prepare(
    `
      SELECT
        COUNT(*) AS events_count,
        COALESCE(SUM(completion_word_count), 0) AS total_words,
        COALESCE(SUM(files_edited_count), 0) AS files_edited_total,
        COUNT(DISTINCT git_email) AS unique_users
      FROM completion_events
    `,
  ).first();

  return json(summary ?? {}, 200, withCorsHeaders());
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: withCorsHeaders() });
    }

    if (url.pathname === "/mcp") {
      if (!isAuthorizedMcpCall(request, env)) {
        return json({ error: "Unauthorized MCP request." }, 401);
      }
      return mcpHandler.fetch(request, env, ctx);
    }

    if (request.method === "GET" && url.pathname === "/api/stats/users") {
      return getUsersStats(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/stats/events") {
      return getEvents(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/stats/summary") {
      return getSummary(env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "worldcommits-mcp-server" });
    }

    return json({ error: "Not found" }, 404);
  },
};
