/**
 * LLM-native chat over the dashboard data layer.
 *
 * A user asks a natural-language question; the model is given a small set of
 * tools that map one-to-one onto {@link DashboardData}. The model decides which
 * tool to call, we execute it against the *real* data, feed the result back,
 * and the model produces a grounded answer.
 *
 * Provider: Azure OpenAI Responses API (deployment `gpt-5.5`). The API key is
 * read from the environment only and is **never** hardcoded. When it is unset
 * the module degrades gracefully — it returns a "configure key" message instead
 * of throwing — so a dashboard can render without secrets configured.
 */
import type { DashboardData, QueryRunsFilter } from './data.js';

/** Message returned to the user when no API key is configured. */
export const CONFIGURE_KEY_MESSAGE =
  'Chat is unavailable: set AZURE_OPENAI_API_KEY to enable LLM-native answers over your data.';

/** Names of the tools exposed to the model. Kept in sync with {@link DashboardData}. */
export type ToolName = 'query_runs' | 'get_flaky_specs' | 'get_loop_stats';

/** A tool call the model asked us to make. */
export type ToolCall = {
  name: ToolName;
  /** Already-parsed arguments object (the provider client parses JSON). */
  arguments: Record<string, unknown>;
};

/**
 * Minimal provider-client surface the chat orchestrator depends on. The real
 * Azure client implements this; tests supply a mock. Keeping this tiny is what
 * lets tests assert routing without any network.
 */
export type LlmClient = {
  /**
   * Given the user question and the available tools, return either a set of
   * tool calls to execute (the model wants data) or a final text answer.
   */
  createResponse(input: {
    question: string;
    tools: readonly ToolSchema[];
    /** Present on the second pass: results of the tool calls from pass one. */
    toolResults?: ToolResult[];
  }): Promise<{ toolCalls: ToolCall[]; text: string | null }>;
};

/** A single tool's JSON-schema description handed to the model. */
export type ToolSchema = {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
};

/** The outcome of executing one {@link ToolCall} against the data layer. */
export type ToolResult = {
  name: ToolName;
  /** JSON-serializable result from the data layer. */
  result: unknown;
};

/** Result of a chat turn. */
export type ChatResult = {
  /** The model's final, data-grounded answer (or the configure-key message). */
  answer: string;
  /** Whether a usable provider was configured for this turn. */
  ok: boolean;
  /** Tool calls executed, in order — surfaced so a UI can show provenance. */
  toolCalls: ToolName[];
};

/** The tool catalog handed to the model. */
export const TOOLS: readonly ToolSchema[] = [
  {
    name: 'query_runs',
    description:
      'List individual spec runs. Filter by status (passed|failed), spec name, or limit.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['passed', 'failed'] },
        spec: { type: 'string' },
        limit: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_flaky_specs',
    description:
      'Return specs that both pass and fail across the window, with their flake rate. Use this to answer "which specs are flaky?".',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_loop_stats',
    description:
      'Aggregate proof-loop health: total runs, pass rate, average duration.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
] as const;

/** Execute one tool call against the data layer. Unknown tools throw. */
export async function executeTool(
  call: ToolCall,
  data: DashboardData,
): Promise<ToolResult> {
  switch (call.name) {
    case 'query_runs': {
      const filter: QueryRunsFilter = {};
      const a = call.arguments;
      if (a.status === 'passed' || a.status === 'failed') filter.status = a.status;
      if (typeof a.spec === 'string') filter.spec = a.spec;
      if (typeof a.limit === 'number') filter.limit = a.limit;
      return { name: call.name, result: await data.queryRuns(filter) };
    }
    case 'get_flaky_specs':
      return { name: call.name, result: await data.getFlakySpecs() };
    case 'get_loop_stats':
      return { name: call.name, result: await data.getLoopStats() };
    default: {
      const exhaustive: never = call.name;
      throw new Error(`Unknown tool: ${String(exhaustive)}`);
    }
  }
}

/**
 * Answer a question about the data.
 *
 * @param question  Natural-language user question.
 * @param data      The data layer the tools query.
 * @param client    Provider client; defaults to the Azure client built from env.
 *                  When env is missing, the default client is `null` and we
 *                  return {@link CONFIGURE_KEY_MESSAGE} without throwing.
 */
export async function chat(
  question: string,
  data: DashboardData,
  client: LlmClient | null = createAzureClientFromEnv(),
): Promise<ChatResult> {
  if (!client) {
    return { answer: CONFIGURE_KEY_MESSAGE, ok: false, toolCalls: [] };
  }

  // Pass 1: let the model pick tools.
  const first = await client.createResponse({ question, tools: TOOLS });

  if (first.toolCalls.length === 0) {
    return { answer: first.text ?? '', ok: true, toolCalls: [] };
  }

  const toolResults: ToolResult[] = [];
  for (const call of first.toolCalls) {
    toolResults.push(await executeTool(call, data));
  }

  // Pass 2: model answers grounded in the executed tool results.
  const second = await client.createResponse({ question, tools: TOOLS, toolResults });

  return {
    answer: second.text ?? '',
    ok: true,
    toolCalls: toolResults.map((r) => r.name),
  };
}

/**
 * Build the Azure Responses-API client from environment variables. Returns
 * `null` (no throw) when `AZURE_OPENAI_API_KEY` is unset so callers can degrade
 * gracefully. The key is read from the environment only — never hardcoded.
 */
/**
 * Browser-safe env access: `process` does not exist in a browser bundle, so
 * referencing `process.env` directly throws "process is not defined". Guard it
 * so the dashboard degrades gracefully client-side instead of erroring.
 */
function readEnv(): Record<string, string | undefined> {
  return typeof process !== 'undefined' && process.env ? process.env : {};
}

export function createAzureClientFromEnv(
  env: Record<string, string | undefined> = readEnv(),
): LlmClient | null {
  const apiKey = env.AZURE_OPENAI_API_KEY;
  if (!apiKey) return null;

  const endpoint =
    env.AZURE_OPENAI_ENDPOINT ??
    'https://donis-m7ex662m-eastus2.cognitiveservices.azure.com';
  const deployment = env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-5.5';
  const apiVersion = '2025-04-01-preview';
  const url = `${endpoint.replace(/\/$/, '')}/openai/responses?api-version=${apiVersion}`;

  return {
    async createResponse({ question, tools, toolResults }) {
      const body = {
        model: deployment,
        input: buildInput(question, toolResults),
        tools: tools.map((t) => ({
          type: 'function',
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Azure responses API error: ${res.status} ${res.statusText}`);
      }
      return parseAzureResponse((await res.json()) as AzureResponse);
    },
  };
}

/** Build the Responses-API `input` array for a turn. */
function buildInput(question: string, toolResults?: ToolResult[]) {
  const input: unknown[] = [{ role: 'user', content: question }];
  if (toolResults) {
    for (const r of toolResults) {
      input.push({
        role: 'tool',
        content: JSON.stringify({ tool: r.name, result: r.result }),
      });
    }
  }
  return input;
}

/** Shape of the bits of the Azure Responses payload we consume. */
type AzureResponse = {
  output?: Array<{
    type?: string;
    name?: string;
    arguments?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
};

/** Map an Azure Responses payload onto our provider-agnostic shape. */
export function parseAzureResponse(payload: AzureResponse): {
  toolCalls: ToolCall[];
  text: string | null;
} {
  const toolCalls: ToolCall[] = [];
  let text: string | null = payload.output_text ?? null;

  for (const item of payload.output ?? []) {
    if (item.type === 'function_call' && isToolName(item.name)) {
      let args: Record<string, unknown> = {};
      try {
        args = item.arguments ? (JSON.parse(item.arguments) as Record<string, unknown>) : {};
      } catch {
        args = {};
      }
      toolCalls.push({ name: item.name, arguments: args });
    }
    // Only use message content as `text` when the top-level output_text field
    // was not already set. output_text is the authoritative Azure summary and
    // must take precedence over per-message content items.
    if (item.type === 'message' && item.content && payload.output_text === undefined) {
      const joined = item.content
        .filter((c) => c.type === 'output_text' && typeof c.text === 'string')
        .map((c) => c.text)
        .join('');
      if (joined) text = joined;
    }
  }
  return { toolCalls, text };
}

function isToolName(v: unknown): v is ToolName {
  return v === 'query_runs' || v === 'get_flaky_specs' || v === 'get_loop_stats';
}
