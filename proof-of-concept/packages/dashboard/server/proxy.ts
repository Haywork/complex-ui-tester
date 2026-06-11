/**
 * Browser-safe chat proxy for the dashboard.
 *
 * The dashboard's chat (src/chat.ts) talks to Azure OpenAI's Responses API,
 * which requires a secret `api-key`. That key must NEVER reach the browser: it
 * cannot live in the client bundle, in `import.meta.env`, or in git. This tiny
 * Node server is the trusted boundary — it holds `AZURE_OPENAI_API_KEY` in the
 * server-side process environment only, and exposes a single endpoint:
 *
 *     POST /api/chat   { question: string }  ->  { answer, ok, toolCalls }
 *
 * The browser calls this relative endpoint; the proxy forwards the request to
 * Azure (attaching the key server-side) and returns the model's answer. The key
 * is never echoed back in any response, success or error.
 *
 * Design: the forwarding logic ({@link forwardToAzure}) and the request handler
 * ({@link handleChatRequest}) are pure-ish, fetch-injectable functions so the
 * whole proxy is unit-testable with a mocked `fetch` and no real socket.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import {
  chat,
  createAzureClientFromEnv,
  CONFIGURE_KEY_MESSAGE,
  type ChatResult,
  type DashboardData,
} from '../src/index.js';

/** Path the dashboard's browser client POSTs to. Kept in one place. */
export const CHAT_ROUTE = '/api/chat';

/** Clean, key-free message returned to the browser when the upstream fails. */
export const UPSTREAM_ERROR_MESSAGE =
  'Chat is temporarily unavailable: the language model upstream returned an error.';

/** Shape the browser sends. */
export type ChatRequestBody = { question?: unknown };

/** Shape the proxy returns. Mirrors {@link ChatResult} so the client is unchanged. */
export type ChatResponseBody = ChatResult;

/** A handler result: the HTTP status and the JSON body to write. */
export type HandlerOutput = { status: number; body: ChatResponseBody };

/**
 * Run one chat turn server-side and shape it into an HTTP response.
 *
 * Errors from the upstream (a thrown Azure non-2xx, a network failure, etc.) are
 * caught and converted into a 502 with a clean, key-free message — the raw error
 * (which could embed the request URL or headers) is never forwarded to the
 * browser.
 *
 * @param body    Parsed JSON request body from the browser.
 * @param data    The server-side data layer the chat tools query.
 * @param client  Provider client; defaults to one built from the server env.
 *                When the key is unset this is `null` and we return the existing
 *                graceful "configure key" message with a 200 (not an error) so
 *                the browser's degrade path is preserved.
 */
export async function handleChatRequest(
  body: ChatRequestBody,
  data: DashboardData,
  client = createAzureClientFromEnv(),
): Promise<HandlerOutput> {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return {
      status: 400,
      body: { answer: 'A non-empty "question" string is required.', ok: false, toolCalls: [] },
    };
  }

  if (!client) {
    // No key configured: preserve the graceful-degrade contract (HTTP 200).
    return { status: 200, body: { answer: CONFIGURE_KEY_MESSAGE, ok: false, toolCalls: [] } };
  }

  try {
    const result = await chat(question, data, client);
    return { status: 200, body: result };
  } catch {
    // Swallow the raw error: it may reference the upstream URL/headers. The
    // browser only ever sees a generic, key-free message.
    return {
      status: 502,
      body: { answer: UPSTREAM_ERROR_MESSAGE, ok: false, toolCalls: [] },
    };
  }
}

/**
 * Read a request body to a string, capped to guard against oversized payloads.
 *
 * When the body exceeds `limitBytes` the promise rejects with an
 * `'request body too large'` error. Critically, we do **not** call
 * `req.destroy()` here: destroying the socket inside the data event fires
 * before the response can be written, so the caller (handle) would try to
 * write a JSON 400 on an already-closed socket — the client sees ECONNRESET
 * instead of the intended error body. The caller is responsible for draining
 * and destroying the request after it has written its response.
 */
function readBody(req: IncomingMessage, limitBytes = 64 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk: Buffer) => {
      if (tooLarge) return; // keep draining silently — destroy happens after response
      size += chunk.length;
      if (size > limitBytes) {
        tooLarge = true;
        reject(new Error('request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!tooLarge) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (!tooLarge) reject(err);
    });
  });
}

/**
 * Build the proxy HTTP server. Only `POST {@link CHAT_ROUTE}` is handled; every
 * other route/method gets a clean 404/405. The server holds no secret itself —
 * the secret lives in the {@link createAzureClientFromEnv} client it builds per
 * request from `process.env`.
 *
 * @param data  The data layer chat tools query. Defaults are wired by the
 *              entrypoint; tests inject a fixture.
 */
export function createProxyServer(data: DashboardData): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    void handle(req, res, data);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse, data: DashboardData): Promise<void> {
  const url = req.url ?? '';
  const writeJson = (status: number, body: unknown): void => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (url !== CHAT_ROUTE) {
    writeJson(404, { answer: 'Not found.', ok: false, toolCalls: [] });
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json', allow: 'POST' });
    res.end(JSON.stringify({ answer: 'Method not allowed.', ok: false, toolCalls: [] }));
    return;
  }

  let parsed: ChatRequestBody;
  try {
    const raw = await readBody(req);
    parsed = raw ? (JSON.parse(raw) as ChatRequestBody) : {};
  } catch (err) {
    // Write the JSON 400 *before* destroying the socket so the client receives
    // the full response. After res.end() we drain any remaining buffered bytes
    // and close the underlying socket cleanly.
    const message =
      err instanceof Error && err.message === 'request body too large'
        ? 'Request body too large (max 64 KB).'
        : 'Invalid JSON request body.';
    writeJson(400, { answer: message, ok: false, toolCalls: [] });
    // Drain remaining data so the socket is not left in a half-open state.
    req.resume();
    return;
  }

  const out = await handleChatRequest(parsed, data);
  writeJson(out.status, out.body);
}

/**
 * Forward a single chat turn to Azure directly (lower-level than
 * {@link handleChatRequest}, exposed for tests that assert wire behaviour:
 * correct URL/header, no key leakage). Most callers should use
 * {@link handleChatRequest} which runs the full two-pass tool loop.
 */
export async function forwardToAzure(
  question: string,
  data: DashboardData,
  client = createAzureClientFromEnv(),
): Promise<ChatResult> {
  if (!client) return { answer: CONFIGURE_KEY_MESSAGE, ok: false, toolCalls: [] };
  return chat(question, data, client);
}
