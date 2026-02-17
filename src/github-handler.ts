import { env } from "cloudflare:workers";
import type {
  AuthRequest,
  OAuthHelpers,
} from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl } from "./utils";
import type { Props } from "./utils";
import {
  clientIdAlreadyApproved,
  parseRedirectApproval,
  renderApprovalDialog,
} from "./workers-oauth-utils";

type Bindings = Env & { OAUTH_PROVIDER: OAuthHelpers };

const app = new Hono<{ Bindings: Bindings }>();

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const { clientId } = oauthReqInfo;
  if (!clientId) {
    return c.text("Invalid request", 400);
  }

  if (
    await clientIdAlreadyApproved(
      c.req.raw,
      oauthReqInfo.clientId,
      env.COOKIE_ENCRYPTION_KEY,
    )
  ) {
    return redirectToGithub(c.req.raw, oauthReqInfo);
  }

  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    server: {
      name: "Worldcommits",
      description:
        "Authorize this MCP client to publish your coding sessions to the Worldcommits public feed.",
      logo: "https://worldcommits.com/favicon-32x32.png",
    },
    state: { oauthReqInfo },
  });
});

app.post("/authorize", async (c) => {
  const { state, headers } = await parseRedirectApproval(
    c.req.raw,
    env.COOKIE_ENCRYPTION_KEY,
  );
  if (!state.oauthReqInfo) {
    return c.text("Invalid request", 400);
  }
  return redirectToGithub(c.req.raw, state.oauthReqInfo as AuthRequest, headers);
});

app.get("/callback", async (c) => {
  const stateParam = c.req.query("state");
  if (!stateParam) {
    return c.text("Missing state", 400);
  }

  const oauthReqInfo = JSON.parse(atob(stateParam)) as AuthRequest;
  if (!oauthReqInfo.clientId) {
    return c.text("Invalid state", 400);
  }

  const [accessToken, errResponse] = await fetchUpstreamAuthToken({
    client_id: c.env.GITHUB_CLIENT_ID,
    client_secret: c.env.GITHUB_CLIENT_SECRET,
    code: c.req.query("code"),
    redirect_uri: new URL("/callback", c.req.url).href,
    upstream_url: "https://github.com/login/oauth/access_token",
  });
  if (errResponse) return errResponse;

  const userResp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "worldcommits-mcp",
    },
  });
  if (!userResp.ok) {
    return c.text("Failed to fetch GitHub user", 500);
  }

  const userData = (await userResp.json()) as {
    login: string;
    name: string | null;
    email: string | null;
  };
  let { login, name, email } = userData;

  if (!email) {
    try {
      const emailResp = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "User-Agent": "worldcommits-mcp",
        },
      });
      if (emailResp.ok) {
        const emails = (await emailResp.json()) as {
          email: string;
          primary: boolean;
          verified: boolean;
        }[];
        const primary = emails.find((e) => e.primary && e.verified);
        const verified = emails.find((e) => e.verified);
        email =
          primary?.email ?? verified?.email ?? emails[0]?.email ?? null;
      }
    } catch {
      // continue without email
    }
  }

  const propsToSend: Props = {
    accessToken,
    email: email ?? `${login}@users.noreply.github.com`,
    login,
    name: name ?? login,
  };

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    metadata: { label: name ?? login },
    props: propsToSend,
    request: oauthReqInfo,
    scope: oauthReqInfo.scope,
    userId: login,
  });

  return Response.redirect(redirectTo);
});

async function redirectToGithub(
  request: Request,
  oauthReqInfo: AuthRequest,
  headers: Record<string, string> = {},
) {
  return new Response(null, {
    headers: {
      ...headers,
      location: getUpstreamAuthorizeUrl({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: new URL("/callback", request.url).href,
        scope: "read:user user:email",
        state: btoa(JSON.stringify(oauthReqInfo)),
        upstream_url: "https://github.com/login/oauth/authorize",
      }),
    },
    status: 302,
  });
}

export { app as GitHubHandler };
