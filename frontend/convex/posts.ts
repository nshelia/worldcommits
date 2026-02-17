import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const MAX_MICRO_SUMMARY_LENGTH = 300;
const anyInternal = internal as any;

type IngestEventInput = {
  sessionId: string;
  userId?: string;
  githubUsername: string;
  timestamp: number;
  promptLength: number;
  containsCodeBlock: boolean;
  modelUsed: string;
  retryIndex: number;
  timeSinceLastPromptMs: number;
  aiEditSuggested: boolean;
  aiEditAccepted: boolean;
  manualOverride: boolean;
  linesAddedCount: number;
  linesRemovedCount: number;
  repeatedPatternDetected: boolean;
  highRetryRate: boolean;
  microSummary: string;
  markSessionCompleted?: boolean;
};

function sanitizeMicroSummary(summary: string): string {
  const stripped = summary
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(?:[A-Za-z]:)?\/?[\w.-]+(?:\/[\w.-]+)+\b/g, "[path]")
    .trim();
  return stripped.slice(0, MAX_MICRO_SUMMARY_LENGTH);
}

function createPostCopy(args: {
  githubUsername: string;
  promptCount: number;
  highRetryEventsCount: number;
  manualOverrideCount: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  recentSummaries: string[];
}): { title: string; description: string } {
  const pressure = args.highRetryEventsCount > 2 ? "high" : "steady";
  const intent =
    args.manualOverrideCount > args.promptCount / 2
      ? "manual-heavy iteration"
      : "ai-guided iteration";
  const title = `${args.githubUsername} · ${intent} · ${pressure} pressure`;

  const fallbackDescription = `Prompts: ${args.promptCount}. Lines +${args.totalLinesAdded} / -${args.totalLinesRemoved}.`;
  const description = args.recentSummaries.length
    ? args.recentSummaries.join(" ").slice(0, MAX_MICRO_SUMMARY_LENGTH)
    : fallbackDescription;

  return { title, description };
}

const ingestEventArgs = {
  sessionId: v.string(),
  userId: v.optional(v.string()),
  githubUsername: v.string(),
  timestamp: v.number(),
  promptLength: v.number(),
  containsCodeBlock: v.boolean(),
  modelUsed: v.string(),
  retryIndex: v.number(),
  timeSinceLastPromptMs: v.number(),
  aiEditSuggested: v.boolean(),
  aiEditAccepted: v.boolean(),
  manualOverride: v.boolean(),
  linesAddedCount: v.number(),
  linesRemovedCount: v.number(),
  repeatedPatternDetected: v.boolean(),
  highRetryRate: v.boolean(),
  microSummary: v.string(),
  markSessionCompleted: v.optional(v.boolean()),
} as const;

const rewriteArgs = {
  postId: v.id("posts"),
  promptCount: v.number(),
  markSessionCompleted: v.boolean(),
} as const;

function getEnv(name: string): string | undefined {
  return (globalThis as any).process?.env?.[name] as string | undefined;
}

function shouldRewriteNow(args: { promptCount: number; markSessionCompleted: boolean }) {
  if (args.markSessionCompleted) return true;
  if (getEnv("POST_REWRITE_ON_EVERY_PROMPT") === "true") return true;

  const everyNRaw = getEnv("POST_REWRITE_EVERY_N_PROMPTS");
  const everyN = everyNRaw ? Number(everyNRaw) : 0;
  if (Number.isFinite(everyN) && everyN > 0 && args.promptCount % everyN === 0) {
    return true;
  }

  return false;
}

function pickProvider(): { provider: "openai" | "google"; model: string; key: string } | null {
  const openAiKey = getEnv("OPENAI_API_KEY");
  const googleKey = getEnv("GEMINI_API_KEY");
  const randomize = getEnv("POST_REWRITE_RANDOM_PROVIDER") === "true";

  if (openAiKey && googleKey && randomize) {
    if (Math.random() > 0.5) {
      return {
        provider: "openai",
        model: getEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
        key: openAiKey,
      };
    }
    return {
      provider: "google",
      model: getEnv("GEMINI_MODEL") ?? "gemini-1.5-flash",
      key: googleKey,
    };
  }

  if (openAiKey) {
    return {
      provider: "openai",
      model: getEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
      key: openAiKey,
    };
  }
  if (googleKey) {
    return {
      provider: "google",
      model: getEnv("GEMINI_MODEL") ?? "gemini-1.5-flash",
      key: googleKey,
    };
  }
  return null;
}

function buildRewritePrompt(input: {
  githubUsername: string;
  promptCount: number;
  totalWords: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  aiAcceptedCount: number;
  manualOverrideCount: number;
  highRetryEventsCount: number;
  timelineSummaries: string[];
}) {
  return `
You write short public feed copy for coding session telemetry.
Return strict JSON only: {"title":"...","description":"..."}.
Rules:
- title <= 90 chars
- description <= 280 chars
- no code, no file names, no stack traces, no secrets
- concrete and readable

Telemetry:
githubUsername=${input.githubUsername}
promptCount=${input.promptCount}
totalWords=${input.totalWords}
totalLinesAdded=${input.totalLinesAdded}
totalLinesRemoved=${input.totalLinesRemoved}
aiAcceptedCount=${input.aiAcceptedCount}
manualOverrideCount=${input.manualOverrideCount}
highRetryEventsCount=${input.highRetryEventsCount}
timelineSummaries=${JSON.stringify(input.timelineSummaries)}
`.trim();
}

function parseRewriteJson(text: string): { title: string; description: string } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = trimmed.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate) as { title?: unknown; description?: unknown };
    if (typeof parsed.title !== "string" || typeof parsed.description !== "string") return null;
    return {
      title: parsed.title.slice(0, 90),
      description: parsed.description.slice(0, 280),
    };
  } catch {
    return null;
  }
}

async function rewriteWithProvider(
  providerInfo: { provider: "openai" | "google"; model: string; key: string },
  prompt: string,
): Promise<{ title: string; description: string } | null> {
  if (providerInfo.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${providerInfo.key}`,
      },
      body: JSON.stringify({
        model: providerInfo.model,
        temperature: 0.4,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "You rewrite telemetry into safe short social copy. Output strict JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return parseRewriteJson(text);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${providerInfo.model}:generateContent?key=${providerInfo.key}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 180,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join(" ") ?? "";
  return parseRewriteJson(text);
}

async function ingestPromptEventCore(
  ctx: any,
  args: IngestEventInput,
) {
  const now = Date.now();
  const safeSummary = sanitizeMicroSummary(args.microSummary);

  const existingPost = await ctx.db
    .query("posts")
    .withIndex("by_session_id", (q: any) => q.eq("sessionId", args.sessionId))
    .unique();

  let postId: Id<"posts">;
  if (!existingPost) {
    const newPostCopy = createPostCopy({
      githubUsername: args.githubUsername,
      promptCount: 1,
      highRetryEventsCount: args.highRetryRate ? 1 : 0,
      manualOverrideCount: args.manualOverride ? 1 : 0,
      totalLinesAdded: args.linesAddedCount,
      totalLinesRemoved: args.linesRemovedCount,
      recentSummaries: safeSummary ? [safeSummary] : [],
    });
    postId = await ctx.db.insert("posts", {
      sessionId: args.sessionId,
      userId: args.userId,
      githubUsername: args.githubUsername,
      title: newPostCopy.title,
      description: newPostCopy.description,
      status: args.markSessionCompleted ? "completed" : "active",
      promptCount: 1,
      totalWords: args.promptLength,
      totalLinesAdded: args.linesAddedCount,
      totalLinesRemoved: args.linesRemovedCount,
      aiAcceptedCount: args.aiEditAccepted ? 1 : 0,
      manualOverrideCount: args.manualOverride ? 1 : 0,
      highRetryEventsCount: args.highRetryRate ? 1 : 0,
      startedAt: args.timestamp,
      lastPromptAt: args.timestamp,
      endedAt: args.markSessionCompleted ? args.timestamp : undefined,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    postId = existingPost._id;
  }

  await ctx.db.insert("timelineEvents", {
    postId,
    sessionId: args.sessionId,
    githubUsername: args.githubUsername,
    timestamp: args.timestamp,
    promptLength: args.promptLength,
    containsCodeBlock: args.containsCodeBlock,
    modelUsed: args.modelUsed,
    retryIndex: args.retryIndex,
    timeSinceLastPromptMs: args.timeSinceLastPromptMs,
    aiEditSuggested: args.aiEditSuggested,
    aiEditAccepted: args.aiEditAccepted,
    manualOverride: args.manualOverride,
    linesAddedCount: args.linesAddedCount,
    linesRemovedCount: args.linesRemovedCount,
    repeatedPatternDetected: args.repeatedPatternDetected,
    highRetryRate: args.highRetryRate,
    microSummary: safeSummary,
    createdAt: now,
  });

  const post = await ctx.db.get(postId);
  if (!post) {
    throw new Error("Failed to load post after event insert.");
  }

  const promptCount = post.promptCount + 1;
  const totalWords = post.totalWords + args.promptLength;
  const totalLinesAdded = post.totalLinesAdded + args.linesAddedCount;
  const totalLinesRemoved = post.totalLinesRemoved + args.linesRemovedCount;
  const aiAcceptedCount = post.aiAcceptedCount + (args.aiEditAccepted ? 1 : 0);
  const manualOverrideCount = post.manualOverrideCount + (args.manualOverride ? 1 : 0);
  const highRetryEventsCount = post.highRetryEventsCount + (args.highRetryRate ? 1 : 0);

  const recentEvents = await ctx.db
    .query("timelineEvents")
    .withIndex("by_post_id_timestamp", (q: any) => q.eq("postId", postId))
    .order("desc")
    .take(4);
  const recentSummaries = recentEvents
    .map((event: any) => event.microSummary)
    .filter((summary: string) => summary.length > 0)
    .slice(0, 3);

  const copy = createPostCopy({
    githubUsername: post.githubUsername,
    promptCount,
    highRetryEventsCount,
    manualOverrideCount,
    totalLinesAdded,
    totalLinesRemoved,
    recentSummaries,
  });

  await ctx.db.patch(postId, {
    title: copy.title,
    description: copy.description,
    status: args.markSessionCompleted ? "completed" : post.status,
    promptCount,
    totalWords,
    totalLinesAdded,
    totalLinesRemoved,
    aiAcceptedCount,
    manualOverrideCount,
    highRetryEventsCount,
    lastPromptAt: Math.max(post.lastPromptAt, args.timestamp),
    endedAt: args.markSessionCompleted ? args.timestamp : post.endedAt,
    updatedAt: now,
  });

  return {
    postId,
    promptCount,
    markSessionCompleted: Boolean(args.markSessionCompleted),
  };
}

export const ingestPromptEvent = mutation({
  args: ingestEventArgs,
  handler: async (ctx, args) => {
    return ingestPromptEventCore(ctx, args);
  },
});

export const ingestPromptEventInternal = internalMutation({
  args: ingestEventArgs,
  handler: async (ctx, args) => {
    return ingestPromptEventCore(ctx, args);
  },
});

export const getRewriteContextInternal = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const timeline = await ctx.db
      .query("timelineEvents")
      .withIndex("by_post_id_timestamp", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(12);
    return { post, timeline };
  },
});

export const applyRewrittenCopyInternal = internalMutation({
  args: {
    postId: v.id("posts"),
    title: v.string(),
    description: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      title: args.title.slice(0, 90),
      description: args.description.slice(0, 280),
      lastRewriteAt: Date.now(),
      lastRewriteProvider: args.provider,
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

export const maybeRewritePostCopyInternal = internalAction({
  args: rewriteArgs,
  handler: async (ctx, args) => {
    if (!shouldRewriteNow(args)) {
      return { rewritten: false, reason: "rewrite-policy-skip" as const };
    }

    const providerInfo = pickProvider();
    if (!providerInfo) {
      return { rewritten: false, reason: "provider-not-configured" as const };
    }

    const context = await ctx.runQuery(anyInternal.posts.getRewriteContextInternal, {
      postId: args.postId,
    });
    if (!context) {
      return { rewritten: false, reason: "post-not-found" as const };
    }

    const fallback = createPostCopy({
      githubUsername: context.post.githubUsername,
      promptCount: context.post.promptCount,
      highRetryEventsCount: context.post.highRetryEventsCount,
      manualOverrideCount: context.post.manualOverrideCount,
      totalLinesAdded: context.post.totalLinesAdded,
      totalLinesRemoved: context.post.totalLinesRemoved,
      recentSummaries: context.timeline
        .map((event: { microSummary: string }) => event.microSummary)
        .filter((s: string) => Boolean(s))
        .slice(0, 3),
    });

    const prompt = buildRewritePrompt({
      githubUsername: context.post.githubUsername,
      promptCount: context.post.promptCount,
      totalWords: context.post.totalWords,
      totalLinesAdded: context.post.totalLinesAdded,
      totalLinesRemoved: context.post.totalLinesRemoved,
      aiAcceptedCount: context.post.aiAcceptedCount,
      manualOverrideCount: context.post.manualOverrideCount,
      highRetryEventsCount: context.post.highRetryEventsCount,
      timelineSummaries: context.timeline
        .map((event: { microSummary: string }) => event.microSummary)
        .filter((s: string) => Boolean(s))
        .slice(0, 5),
    });

    let rewritten = await rewriteWithProvider(providerInfo, prompt);
    if (!rewritten) {
      rewritten = fallback;
    }

    await ctx.runMutation(anyInternal.posts.applyRewrittenCopyInternal, {
      postId: args.postId,
      title: rewritten.title,
      description: rewritten.description,
      provider: providerInfo.provider,
    });

    return { rewritten: true, provider: providerInfo.provider };
  },
});

export const ingestPromptEventWithRewrite = action({
  args: ingestEventArgs,
  handler: async (ctx, args): Promise<{ ingest: any; rewrite: any }> => {
    const ingest = await ctx.runMutation(anyInternal.posts.ingestPromptEventInternal, args);
    const rewrite = await ctx.runAction(anyInternal.posts.maybeRewritePostCopyInternal, {
      postId: ingest.postId,
      promptCount: ingest.promptCount,
      markSessionCompleted: ingest.markSessionCompleted,
    });
    return { ingest, rewrite };
  },
});

export const ingestPromptEventWithRewriteInternal = internalAction({
  args: ingestEventArgs,
  handler: async (ctx, args): Promise<{ ingest: any; rewrite: any }> => {
    const ingest = await ctx.runMutation(anyInternal.posts.ingestPromptEventInternal, args);
    const rewrite = await ctx.runAction(anyInternal.posts.maybeRewritePostCopyInternal, {
      postId: ingest.postId,
      promptCount: ingest.promptCount,
      markSessionCompleted: ingest.markSessionCompleted,
    });
    return { ingest, rewrite };
  },
});

export const completeSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!post) {
      return { updated: false };
    }
    await ctx.db.patch(post._id, {
      status: "completed",
      endedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

export const listPublicPosts = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("posts")
      .withIndex("by_updated_at")
      .order("desc")
      .paginate(args.paginationOpts);

    const items = await Promise.all(
      page.page.map(async (post) => {
        const timeline = await ctx.db
          .query("timelineEvents")
          .withIndex("by_post_id_timestamp", (q) => q.eq("postId", post._id))
          .order("desc")
          .take(20);
        return { post, timeline };
      }),
    );

    return {
      page: items,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const listPublicPostsByUsername = query({
  args: {
    githubUsername: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("posts")
      .withIndex("by_github_username", (q) =>
        q.eq("githubUsername", args.githubUsername),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const items = await Promise.all(
      page.page.map(async (post) => {
        const timeline = await ctx.db
          .query("timelineEvents")
          .withIndex("by_post_id_timestamp", (q) => q.eq("postId", post._id))
          .order("desc")
          .take(20);
        return { post, timeline };
      }),
    );

    return {
      page: items,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const liveStats = query({
  args: {},
  handler: async (ctx) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const recentEvents = await ctx.db
      .query("timelineEvents")
      .order("desc")
      .filter((q) => q.gte(q.field("timestamp"), tenMinutesAgo))
      .collect();

    const recentPrompts = recentEvents.length;
    const activeUsernames = new Set(recentEvents.map((e) => e.githubUsername));
    const activeVibecoders = activeUsernames.size;

    const allPosts = await ctx.db.query("posts").collect();
    const registeredUsernames = new Set(allPosts.map((p) => p.githubUsername));
    const totalRegistered = registeredUsernames.size;

    return {
      activeVibecoders,
      recentPrompts,
      totalRegistered,
    };
  },
});

function getTimeRangeCutoff(timeRange: string): number | null {
  const now = new Date();
  switch (timeRange) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.getTime();
    }
    case "week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      return start.getTime();
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start.getTime();
    }
    default:
      return null;
  }
}

export const leaderboard = query({
  args: {
    timeRange: v.optional(
      v.union(
        v.literal("today"),
        v.literal("week"),
        v.literal("month"),
        v.literal("all"),
      ),
    ),
    country: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("prompts"),
        v.literal("words"),
        v.literal("lines"),
        v.literal("sessions"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange ?? "all";
    const sortBy = args.sortBy ?? "prompts";
    const cutoff = getTimeRangeCutoff(timeRange);

    let allowedUsernames: Set<string> | null = null;
    if (args.country) {
      const usersWithCountry = await ctx.db
        .query("users")
        .withIndex("by_country", (q) => q.eq("country", args.country!))
        .collect();
      allowedUsernames = new Set(
        usersWithCountry
          .map((u) => u.githubUsername)
          .filter((name): name is string => Boolean(name)),
      );
    }

    const allPosts = await ctx.db.query("posts").collect();

    const userMap = new Map<
      string,
      {
        githubUsername: string;
        totalPrompts: number;
        totalLinesAdded: number;
        totalLinesRemoved: number;
        totalWords: number;
        sessionCount: number;
        lastActiveAt: number;
      }
    >();

    for (const post of allPosts) {
      if (cutoff !== null && post.lastPromptAt < cutoff) continue;
      if (allowedUsernames !== null && !allowedUsernames.has(post.githubUsername))
        continue;

      const existing = userMap.get(post.githubUsername);
      if (existing) {
        existing.totalPrompts += post.promptCount;
        existing.totalLinesAdded += post.totalLinesAdded;
        existing.totalLinesRemoved += post.totalLinesRemoved;
        existing.totalWords += post.totalWords;
        existing.sessionCount += 1;
        existing.lastActiveAt = Math.max(existing.lastActiveAt, post.lastPromptAt);
      } else {
        userMap.set(post.githubUsername, {
          githubUsername: post.githubUsername,
          totalPrompts: post.promptCount,
          totalLinesAdded: post.totalLinesAdded,
          totalLinesRemoved: post.totalLinesRemoved,
          totalWords: post.totalWords,
          sessionCount: 1,
          lastActiveAt: post.lastPromptAt,
        });
      }
    }

    const entries = Array.from(userMap.values());

    const sortFns: Record<string, (a: (typeof entries)[0], b: (typeof entries)[0]) => number> = {
      prompts: (a, b) => b.totalPrompts - a.totalPrompts,
      words: (a, b) => b.totalWords - a.totalWords,
      lines: (a, b) =>
        b.totalLinesAdded + b.totalLinesRemoved - (a.totalLinesAdded + a.totalLinesRemoved),
      sessions: (a, b) => b.sessionCount - a.sessionCount,
    };

    entries.sort(sortFns[sortBy] ?? sortFns.prompts);

    const usernames = entries.slice(0, 100).map((e) => e.githubUsername);
    const userDocs = await Promise.all(
      usernames.map((username) =>
        ctx.db
          .query("users")
          .withIndex("githubUsername", (q) => q.eq("githubUsername", username))
          .unique(),
      ),
    );
    const userCountryMap = new Map<string, string | undefined>();
    for (const doc of userDocs) {
      if (doc?.githubUsername) {
        userCountryMap.set(doc.githubUsername, doc.country);
      }
    }

    return entries.slice(0, 100).map((entry) => ({
      ...entry,
      country: userCountryMap.get(entry.githubUsername) ?? null,
    }));
  },
});

export const leaderboardCountries = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const countries = new Set<string>();
    for (const user of allUsers) {
      if (user.country) {
        countries.add(user.country);
      }
    }
    return Array.from(countries).sort();
  },
});

export const seedDemoTimeline = mutation({
  args: {},
  handler: async (ctx) => {
    const sessionId = `demo-${Date.now()}`;
    const githubUsername = "demo-user";
    const base = Date.now();
    const events: IngestEventInput[] = [
      {
        sessionId,
        githubUsername,
        timestamp: base,
        promptLength: 58,
        containsCodeBlock: false,
        modelUsed: "gpt-5",
        retryIndex: 0,
        timeSinceLastPromptMs: 0,
        aiEditSuggested: true,
        aiEditAccepted: true,
        manualOverride: false,
        linesAddedCount: 22,
        linesRemovedCount: 4,
        repeatedPatternDetected: false,
        highRetryRate: false,
        microSummary: "Kickoff: defined telemetry-first structure for timeline posts.",
      },
      {
        sessionId,
        githubUsername,
        timestamp: base + 45_000,
        promptLength: 81,
        containsCodeBlock: true,
        modelUsed: "gpt-5",
        retryIndex: 1,
        timeSinceLastPromptMs: 45_000,
        aiEditSuggested: true,
        aiEditAccepted: false,
        manualOverride: true,
        linesAddedCount: 8,
        linesRemovedCount: 12,
        repeatedPatternDetected: true,
        highRetryRate: true,
        microSummary:
          "Refined structure after manual override; retried timeline rendering strategy.",
      },
      {
        sessionId,
        githubUsername,
        timestamp: base + 95_000,
        promptLength: 66,
        containsCodeBlock: false,
        modelUsed: "gpt-5",
        retryIndex: 0,
        timeSinceLastPromptMs: 50_000,
        aiEditSuggested: true,
        aiEditAccepted: true,
        manualOverride: false,
        linesAddedCount: 14,
        linesRemovedCount: 3,
        repeatedPatternDetected: false,
        highRetryRate: false,
        microSummary: "Stabilized post card and timeline preview; session completed cleanly.",
        markSessionCompleted: true,
      },
    ];

    for (const event of events) {
      await ctx.runMutation(anyInternal.posts.ingestPromptEventInternal, event);
    }

    return { ok: true, sessionId };
  },
});
