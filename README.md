# Worldcommits MCP Server (Cloudflare Worker + D1)

This is a remote MCP server for logging final agent completion events (for Cursor or any MCP client) into Cloudflare D1.

## Frontend app (TanStack Start + Convex)

A full frontend app is scaffolded in `frontend/`.

- Feed route: `frontend/src/routes/index.tsx`
- Convex schema/functions: `frontend/convex/schema.ts`, `frontend/convex/posts.ts`, `frontend/convex/http.ts`

To run it:

```bash
cd frontend
npx convex dev
npm run dev
```

After Convex is configured, open `http://localhost:3000`.

### Convex Auth (GitHub) setup

The frontend now requires Convex Auth with GitHub to issue user API keys.

Set these Convex environment variables:

```bash
npx convex env set SITE_URL http://localhost:3000
npx convex env set AUTH_GITHUB_ID <github-client-id>
npx convex env set AUTH_GITHUB_SECRET <github-client-secret>
```

Also ensure `JWT_PRIVATE_KEY` and `JWKS` are configured (used by Convex Auth sessions).

## What this server does

- Exposes exactly one MCP tool: `save`
- Stores completion analytics into D1
- Rejects `/mcp` requests unless they include a Bearer token (`MCP_SHARED_SECRET`)
- Exposes public paginated read endpoints for your future UI:
  - `GET /api/stats/users`
  - `GET /api/stats/events`
  - `GET /api/stats/summary`

## Tool contract

`save` expects:

- `api_key` (string, required) — generated in the frontend UI after GitHub login
- `completion_type` (`clarifying_question | plan | plan_succeeded | changes_made | answer_only | error`)
- `completion_status` (`completed | failed`)
- `completion_word_count` (integer)
- `prompt_summary` (string, required) — a 2-3 sentence human-readable summary of the latest user prompt. Should not contain code or secrets.
- optional: `event_id`, `files_edited_count`, `files_edited`, `project`, `client`, `metadata`

`event_id` is used for idempotency. If the same `event_id` is sent again, it is ignored.

## Important security note

No remote MCP endpoint can cryptographically prove "this call came from Cursor only." A caller can always mimic an MCP request.

This server reduces spam with:

- shared secret requirement on `/mcp`
- API key resolution against Convex Auth users (GitHub-linked identity)
- idempotent event insertion with unique `event_id`

If you need stronger protection, add OAuth (Cloudflare Access or third-party OAuth).

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create D1 database:

```bash
npx wrangler d1 create worldcommits-analytics
```

3. Copy the returned `database_id` into `wrangler.jsonc`.

4. Apply migration:

```bash
npx wrangler d1 migrations apply worldcommits-analytics --local
```

5. Create local secrets:

```bash
cp .dev.vars.example .dev.vars
```

Set `MCP_SHARED_SECRET`, `CONVEX_SITE_URL`, and `CONVEX_INGEST_TOKEN` in `.dev.vars`.

6. Run locally:

```bash
npm run dev
```

## Deploy

Set the shared secret:

```bash
npx wrangler secret put MCP_SHARED_SECRET
```

Apply migration to remote D1:

```bash
npx wrangler d1 migrations apply worldcommits-analytics --remote
```

Deploy:

```bash
npm run deploy
```

## Example public API usage

Top users by words:

```bash
curl "https://<your-worker>.workers.dev/api/stats/users?sortBy=words&order=desc&page=1&pageSize=20"
```

Events for one user:

```bash
curl "https://<your-worker>.workers.dev/api/stats/events?git_email=user@example.com&page=1&pageSize=50"
```

## MCP client config concept

Use your remote server URL and send authorization header:

- URL: `https://<your-worker>.workers.dev/mcp`
- Header: `Authorization: Bearer <MCP_SHARED_SECRET>`

Your MCP client or wrapper should call `save` only after completion is finalized, and pass the user-issued `api_key`. GitHub identity is resolved server-side from Convex Auth, not from client-provided git config values.
