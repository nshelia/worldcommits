import type {
  AuthRequest,
  ClientInfo,
} from "@cloudflare/workers-oauth-provider";

const COOKIE_NAME = "mcp-approved-clients";
const ONE_YEAR_IN_SECONDS = 31536000;

function decodeState<T>(encoded: string): T {
  const jsonString = atob(encoded);
  return JSON.parse(jsonString);
}

async function importKey(secret: string): Promise<CryptoKey> {
  if (!secret) {
    throw new Error("COOKIE_ENCRYPTION_KEY is required for signing cookies.");
  }
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
}

async function signData(key: CryptoKey, data: string): Promise<string> {
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(data),
  );
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySignature(
  key: CryptoKey,
  signatureHex: string,
  data: string,
): Promise<boolean> {
  const enc = new TextEncoder();
  try {
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer,
      enc.encode(data),
    );
  } catch {
    return false;
  }
}

async function getApprovedClientsFromCookie(
  cookieHeader: string | null,
  secret: string,
): Promise<string[] | null> {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const targetCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!targetCookie) return null;

  const cookieValue = targetCookie.substring(COOKIE_NAME.length + 1);
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [signatureHex, base64Payload] = parts;
  const payload = atob(base64Payload);
  const key = await importKey(secret);
  const isValid = await verifySignature(key, signatureHex, payload);
  if (!isValid) return null;

  try {
    const approvedClients = JSON.parse(payload);
    if (
      !Array.isArray(approvedClients) ||
      !approvedClients.every((item) => typeof item === "string")
    ) {
      return null;
    }
    return approvedClients as string[];
  } catch {
    return null;
  }
}

export async function clientIdAlreadyApproved(
  request: Request,
  clientId: string,
  cookieSecret: string,
): Promise<boolean> {
  if (!clientId) return false;
  const cookieHeader = request.headers.get("Cookie");
  const approvedClients = await getApprovedClientsFromCookie(
    cookieHeader,
    cookieSecret,
  );
  return approvedClients?.includes(clientId) ?? false;
}

export interface ApprovalDialogOptions {
  client: ClientInfo | null;
  server: {
    name: string;
    logo?: string;
    description?: string;
  };
  state: Record<string, unknown>;
}

function sanitizeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderApprovalDialog(
  _request: Request,
  options: ApprovalDialogOptions,
): Response {
  const { client, server, state } = options;
  const encodedState = btoa(JSON.stringify(state));
  const serverName = sanitizeHtml(server.name);
  const clientName = client?.clientName
    ? sanitizeHtml(client.clientName)
    : "MCP Client";
  const serverDescription = server.description
    ? sanitizeHtml(server.description)
    : "";
  const logoUrl = server.logo ? sanitizeHtml(server.logo) : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize | ${serverName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a0a; color: #e5e5e5; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
    }
    .card {
      background: #171717; border: 1px solid #262626; border-radius: 16px;
      padding: 2rem; max-width: 420px; width: 100%; margin: 1rem;
    }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
    .logo { width: 40px; height: 40px; border-radius: 10px; }
    .title { font-size: 1.1rem; font-weight: 600; color: #fff; }
    .desc { color: #a3a3a3; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
    .client-box {
      background: #0a0a0a; border: 1px solid #262626; border-radius: 12px;
      padding: 1rem; margin-bottom: 1.5rem;
    }
    .client-name { font-weight: 600; color: #fff; font-size: 0.95rem; }
    .client-label { color: #737373; font-size: 0.8rem; margin-top: 0.25rem; }
    .actions { display: flex; gap: 0.75rem; }
    .btn {
      flex: 1; padding: 0.7rem; border-radius: 10px; border: none;
      font-size: 0.9rem; font-weight: 500; cursor: pointer; text-align: center;
    }
    .btn-primary { background: #fff; color: #000; }
    .btn-primary:hover { background: #e5e5e5; }
    .btn-secondary { background: transparent; border: 1px solid #404040; color: #a3a3a3; }
    .btn-secondary:hover { background: #262626; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="" class="logo" />` : ""}
      <span class="title">${serverName}</span>
    </div>
    ${serverDescription ? `<p class="desc">${serverDescription}</p>` : ""}
    <div class="client-box">
      <div class="client-name">${clientName}</div>
      <div class="client-label">wants to connect to this MCP server</div>
    </div>
    <form method="POST" action="/authorize">
      <input type="hidden" name="state" value="${encodedState}" />
      <div class="actions">
        <button type="button" class="btn btn-secondary" onclick="window.close()">Cancel</button>
        <button type="submit" class="btn btn-primary">Approve</button>
      </div>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export interface ParsedApprovalResult {
  state: { oauthReqInfo?: AuthRequest; [key: string]: unknown };
  headers: Record<string, string>;
}

export async function parseRedirectApproval(
  request: Request,
  cookieSecret: string,
): Promise<ParsedApprovalResult> {
  if (request.method !== "POST") {
    throw new Error("Invalid request method. Expected POST.");
  }

  const formData = await request.formData();
  const encodedState = formData.get("state");
  if (typeof encodedState !== "string" || !encodedState) {
    throw new Error("Missing or invalid 'state' in form data.");
  }

  const state = decodeState<{ oauthReqInfo?: AuthRequest }>(encodedState);
  const clientId = state?.oauthReqInfo?.clientId;
  if (!clientId) {
    throw new Error("Could not extract clientId from state object.");
  }

  const cookieHeader = request.headers.get("Cookie");
  const existingApprovedClients =
    (await getApprovedClientsFromCookie(cookieHeader, cookieSecret)) || [];
  const updatedApprovedClients = Array.from(
    new Set([...existingApprovedClients, clientId]),
  );

  const payload = JSON.stringify(updatedApprovedClients);
  const key = await importKey(cookieSecret);
  const signature = await signData(key, payload);
  const newCookieValue = `${signature}.${btoa(payload)}`;

  const headers: Record<string, string> = {
    "Set-Cookie": `${COOKIE_NAME}=${newCookieValue}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${ONE_YEAR_IN_SECONDS}`,
  };

  return { headers, state };
}
