import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  chat,
  executeTool,
  parseAzureResponse,
  createAzureClientFromEnv,
  CONFIGURE_KEY_MESSAGE,
  TOOLS,
  type LlmClient,
  type ToolCall,
  type ToolName,
} from '../src/chat.js';
import {
  makeFixtureData,
  FIXTURE_FLAKY_SPECS,
  FIXTURE_LOOP_STATS,
  FIXTURE_RUNS,
} from './fixtures.js';

/**
 * Build a deterministic mock provider: pass 1 emits the given tool calls,
 * pass 2 echoes the tool results it was handed as the final answer. This lets
 * us assert that the answer is grounded in the *real* tool output rather than
 * invented by the model.
 */
function mockClient(toolCalls: ToolCall[]): LlmClient {
  return {
    createResponse: vi.fn(async ({ toolResults }) => {
      if (!toolResults) return { toolCalls, text: null };
      return { toolCalls: [], text: JSON.stringify(toolResults) };
    }),
  };
}

describe('chat', () => {
  test('"which specs are flaky?" routes to get_flaky_specs and answers from fixtures', async () => {
    const data = makeFixtureData();
    const client = mockClient([{ name: 'get_flaky_specs', arguments: {} }]);

    const result = await chat('which specs are flaky?', data, client);

    expect(result.ok).toBe(true);
    expect(result.toolCalls).toEqual<ToolName[]>(['get_flaky_specs']);
    // Answer is grounded in the actual fixture data, not fabricated.
    expect(result.answer).toContain('segment-collision');
    expect(result.answer).toContain('export-dialog');
    expect(JSON.parse(result.answer)).toEqual([
      { name: 'get_flaky_specs', result: [...FIXTURE_FLAKY_SPECS] },
    ]);
  });

  test('"how many runs passed?" routes to get_loop_stats and grounds the answer in fixtures', async () => {
    const data = makeFixtureData();
    const client = mockClient([{ name: 'get_loop_stats', arguments: {} }]);

    const result = await chat('how many runs passed?', data, client);

    expect(result.toolCalls).toEqual<ToolName[]>(['get_loop_stats']);
    expect(JSON.parse(result.answer)).toEqual([
      { name: 'get_loop_stats', result: FIXTURE_LOOP_STATS },
    ]);
  });

  test('query_runs tool call forwards the status filter to the data layer', async () => {
    const data = makeFixtureData();
    const client = mockClient([
      { name: 'query_runs', arguments: { status: 'failed' } },
    ]);

    const result = await chat('show me the failed runs', data, client);

    const expectedFailed = FIXTURE_RUNS.filter((r) => r.status === 'failed');
    expect(expectedFailed).toHaveLength(2);
    expect(JSON.parse(result.answer)).toEqual([
      { name: 'query_runs', result: expectedFailed },
    ]);
  });

  test('returns the configure-key message and does not throw when client is null', async () => {
    const data = makeFixtureData();

    const result = await chat('which specs are flaky?', data, null);

    expect(result.ok).toBe(false);
    expect(result.answer).toBe(CONFIGURE_KEY_MESSAGE);
    expect(result.toolCalls).toEqual([]);
  });

  test('does not call the data layer when no tool calls are requested', async () => {
    const data = makeFixtureData();
    const queryRuns = vi.spyOn(data, 'queryRuns');
    const client: LlmClient = {
      createResponse: vi.fn(async () => ({ toolCalls: [], text: 'hello' })),
    };

    const result = await chat('hi', data, client);

    expect(result.answer).toBe('hello');
    expect(result.toolCalls).toEqual([]);
    expect(queryRuns).not.toHaveBeenCalled();
  });
});

describe('createAzureClientFromEnv', () => {
  test('returns null when AZURE_OPENAI_API_KEY is unset', () => {
    expect(createAzureClientFromEnv({})).toBeNull();
  });

  test('returns a client when the key is present, without reading any other source', () => {
    const client = createAzureClientFromEnv({ AZURE_OPENAI_API_KEY: 'test-key' });
    expect(client).not.toBeNull();
    expect(typeof client?.createResponse).toBe('function');
  });
});

describe('executeTool', () => {
  test('get_flaky_specs returns the data layer flaky specs verbatim', async () => {
    const data = makeFixtureData();
    const out = await executeTool({ name: 'get_flaky_specs', arguments: {} }, data);
    expect(out).toEqual({ name: 'get_flaky_specs', result: [...FIXTURE_FLAKY_SPECS] });
  });

  test('query_runs passes spec + limit filters through to the data layer', async () => {
    const data = makeFixtureData();
    const out = await executeTool(
      { name: 'query_runs', arguments: { spec: 'segment-collision', limit: 2 } },
      data,
    );
    const expected = FIXTURE_RUNS.filter((r) => r.spec === 'segment-collision').slice(0, 2);
    expect(expected).toHaveLength(2);
    expect(out.result).toEqual(expected);
  });
});

describe('parseAzureResponse', () => {
  test('extracts a function_call with parsed arguments', () => {
    const parsed = parseAzureResponse({
      output: [
        { type: 'function_call', name: 'query_runs', arguments: '{"status":"failed"}' },
      ],
    });
    expect(parsed.toolCalls).toEqual<ToolCall[]>([
      { name: 'query_runs', arguments: { status: 'failed' } },
    ]);
    expect(parsed.text).toBeNull();
  });

  test('extracts message output_text and ignores unknown tool names', () => {
    const parsed = parseAzureResponse({
      output: [
        { type: 'function_call', name: 'not_a_tool', arguments: '{}' },
        { type: 'message', content: [{ type: 'output_text', text: 'final answer' }] },
      ],
    });
    expect(parsed.toolCalls).toEqual([]);
    expect(parsed.text).toBe('final answer');
  });

  test('tolerates malformed JSON arguments by defaulting to an empty object', () => {
    const parsed = parseAzureResponse({
      output: [{ type: 'function_call', name: 'query_runs', arguments: '{not json' }],
    });
    expect(parsed.toolCalls).toEqual<ToolCall[]>([
      { name: 'query_runs', arguments: {} },
    ]);
  });
});

describe('TOOLS catalog', () => {
  test('exposes exactly the three data-layer tools', () => {
    expect(TOOLS.map((t) => t.name).sort()).toEqual(
      ['get_flaky_specs', 'get_loop_stats', 'query_runs'],
    );
  });
});

// ---------------------------------------------------------------------------
// NEW — these tests document intended behaviour that is not yet covered.
// They are intentionally written to FAIL against the current implementation
// so that the implementation gaps become visible and fixable.
// ---------------------------------------------------------------------------

describe('chat — two-pass orchestration contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('createResponse is called exactly twice: once for tool selection, once for grounding', async () => {
    const data = makeFixtureData();
    const client = mockClient([{ name: 'get_loop_stats', arguments: {} }]);

    await chat('summarise health', data, client);

    // The mock is a vi.fn — we can inspect its call count directly.
    expect((client.createResponse as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
  });

  test('pass-1 call receives the verbatim question and the full TOOLS catalog', async () => {
    const data = makeFixtureData();
    const client = mockClient([{ name: 'get_flaky_specs', arguments: {} }]);

    await chat('which specs are flaky?', data, client);

    const firstCallArgs = (client.createResponse as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      question: string;
      tools: readonly unknown[];
      toolResults?: unknown;
    };
    expect(firstCallArgs.question).toBe('which specs are flaky?');
    expect(firstCallArgs.tools).toBe(TOOLS);
    // Pass 1 must NOT include toolResults — that would confuse the model.
    expect(firstCallArgs.toolResults).toBeUndefined();
  });

  test('pass-2 call receives the executed tool results and the same question', async () => {
    const data = makeFixtureData();
    const client = mockClient([{ name: 'get_loop_stats', arguments: {} }]);

    await chat('how healthy is the loop?', data, client);

    const secondCallArgs = (client.createResponse as ReturnType<typeof vi.fn>).mock.calls[1][0] as {
      question: string;
      toolResults: unknown[];
    };
    expect(secondCallArgs.question).toBe('how healthy is the loop?');
    // toolResults must be present and non-empty on the second pass.
    expect(secondCallArgs.toolResults).toBeDefined();
    expect(Array.isArray(secondCallArgs.toolResults)).toBe(true);
    expect((secondCallArgs.toolResults as unknown[]).length).toBeGreaterThan(0);
  });

  test('multiple tool calls in pass-1 are all executed and surfaced in toolCalls', async () => {
    const data = makeFixtureData();
    // The model asks for two tools in one pass.
    const client = mockClient([
      { name: 'get_flaky_specs', arguments: {} },
      { name: 'get_loop_stats', arguments: {} },
    ]);

    const result = await chat('give me a full summary', data, client);

    expect(result.ok).toBe(true);
    // Both tool names must appear, in execution order.
    expect(result.toolCalls).toEqual<ToolName[]>(['get_flaky_specs', 'get_loop_stats']);
    // The pass-2 answer must be grounded in both results.
    const parsed = JSON.parse(result.answer) as Array<{ name: string; result: unknown }>;
    expect(parsed.map((p) => p.name)).toEqual(['get_flaky_specs', 'get_loop_stats']);
  });

  test('answer is an empty string (not null) when pass-2 returns text: null', async () => {
    const data = makeFixtureData();
    const client: LlmClient = {
      createResponse: vi.fn(async ({ toolResults }) => {
        if (!toolResults) return { toolCalls: [{ name: 'get_flaky_specs' as ToolName, arguments: {} }], text: null };
        // Simulate a model that decides not to add any text on the second pass.
        return { toolCalls: [], text: null };
      }),
    };

    const result = await chat('any flaky specs?', data, client);

    expect(result.ok).toBe(true);
    expect(result.answer).toBe('');
  });
});

describe('chat — query_runs filter combinations', () => {
  test('query_runs with only a limit returns the first N runs across all specs', async () => {
    const data = makeFixtureData();
    const client = mockClient([
      { name: 'query_runs', arguments: { limit: 3 } },
    ]);

    const result = await chat('show me the last 3 runs', data, client);

    const parsed = JSON.parse(result.answer) as Array<{ name: string; result: unknown[] }>;
    const runs = parsed[0].result as unknown[];
    // Limit must be respected — no more than 3 rows.
    expect(runs).toHaveLength(3);
  });

  test('query_runs with status:passed returns only passing runs', async () => {
    const data = makeFixtureData();
    const client = mockClient([
      { name: 'query_runs', arguments: { status: 'passed' } },
    ]);

    const result = await chat('show me passing runs', data, client);

    const parsed = JSON.parse(result.answer) as Array<{ name: string; result: Array<{ status: string }> }>;
    const runs = parsed[0].result;
    const expectedPassed = FIXTURE_RUNS.filter((r) => r.status === 'passed');
    expect(runs).toHaveLength(expectedPassed.length);
    // Every returned row must be a passing run.
    for (const run of runs) {
      expect(run.status).toBe('passed');
    }
  });
});

describe('executeTool — get_loop_stats', () => {
  test('get_loop_stats returns the data layer loop stats verbatim', async () => {
    const data = makeFixtureData();
    const out = await executeTool({ name: 'get_loop_stats', arguments: {} }, data);
    expect(out).toEqual({ name: 'get_loop_stats', result: FIXTURE_LOOP_STATS });
  });

  test('query_runs with status:failed returns exactly the two failing fixture runs', async () => {
    const data = makeFixtureData();
    const out = await executeTool(
      { name: 'query_runs', arguments: { status: 'failed' } },
      data,
    );
    const expectedFailed = FIXTURE_RUNS.filter((r) => r.status === 'failed');
    expect(expectedFailed).toHaveLength(2);
    expect(out.result).toEqual(expectedFailed);
  });
});

describe('parseAzureResponse — edge cases', () => {
  test('top-level output_text is returned when output array is absent', () => {
    // The Azure Responses API can return output_text at the top level
    // when no tool calls are needed. This must be surfaced as text.
    const parsed = parseAzureResponse({ output_text: 'direct answer' });
    expect(parsed.text).toBe('direct answer');
    expect(parsed.toolCalls).toEqual([]);
  });

  test('top-level output_text takes precedence over message content in output array', () => {
    // When a response has both output_text (the Azure shorthand) and an
    // output[].message item, the top-level output_text should win because
    // it is the authoritative summary field in the Azure Responses schema.
    // CURRENTLY FAILS: the implementation overwrites output_text with the
    // message content found while iterating output[].
    const parsed = parseAzureResponse({
      output_text: 'authoritative summary',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'verbose message body' }],
        },
      ],
    });
    expect(parsed.text).toBe('authoritative summary');
  });

  test('multiple output_text content items are concatenated in order', () => {
    const parsed = parseAzureResponse({
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'part one ' },
            { type: 'output_text', text: 'part two' },
          ],
        },
      ],
    });
    expect(parsed.text).toBe('part one part two');
  });

  test('multiple function_call items in one response produce multiple tool calls', () => {
    const parsed = parseAzureResponse({
      output: [
        { type: 'function_call', name: 'get_flaky_specs', arguments: '{}' },
        { type: 'function_call', name: 'get_loop_stats', arguments: '{}' },
      ],
    });
    expect(parsed.toolCalls).toEqual<ToolCall[]>([
      { name: 'get_flaky_specs', arguments: {} },
      { name: 'get_loop_stats', arguments: {} },
    ]);
    expect(parsed.text).toBeNull();
  });

  test('empty output array with no output_text returns null text and empty toolCalls', () => {
    const parsed = parseAzureResponse({ output: [] });
    expect(parsed.toolCalls).toEqual([]);
    expect(parsed.text).toBeNull();
  });
});

describe('createAzureClientFromEnv — env var overrides', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('uses AZURE_OPENAI_ENDPOINT override when provided', async () => {
    // Stub the global fetch so no real network call is made.
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: 'ok', output: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const client = createAzureClientFromEnv({
      AZURE_OPENAI_API_KEY: 'key-x',
      AZURE_OPENAI_ENDPOINT: 'https://custom.endpoint.example.com',
    });

    await client!.createResponse({ question: 'test', tools: TOOLS });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://custom.endpoint.example.com');
    expect(calledUrl).not.toContain('donis-m7ex662m-eastus2');
  });

  test('uses AZURE_OPENAI_DEPLOYMENT override as the model field in the request body', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: 'ok', output: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const client = createAzureClientFromEnv({
      AZURE_OPENAI_API_KEY: 'key-x',
      AZURE_OPENAI_DEPLOYMENT: 'gpt-4-turbo',
    });

    await client!.createResponse({ question: 'test', tools: TOOLS });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as { model: string };
    expect(body.model).toBe('gpt-4-turbo');
  });

  test('request body uses deployment gpt-5.5 by default', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: 'ok', output: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const client = createAzureClientFromEnv({ AZURE_OPENAI_API_KEY: 'key-x' });

    await client!.createResponse({ question: 'test', tools: TOOLS });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as { model: string };
    expect(body.model).toBe('gpt-5.5');
  });

  test('throws when the Azure API responds with a non-2xx status', async () => {
    const mockFetch = vi.fn(async () =>
      new Response('Bad Request', { status: 400, statusText: 'Bad Request' }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const client = createAzureClientFromEnv({ AZURE_OPENAI_API_KEY: 'key-x' });

    await expect(
      client!.createResponse({ question: 'test', tools: TOOLS }),
    ).rejects.toThrow('400');
  });

  test('sends the api-key header with the configured API key value', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ output_text: 'ok', output: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const client = createAzureClientFromEnv({ AZURE_OPENAI_API_KEY: 'secret-key-abc' });

    await client!.createResponse({ question: 'test', tools: TOOLS });

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['api-key']).toBe('secret-key-abc');
  });
});

describe('TOOLS catalog — schema shape', () => {
  test('every tool schema has a non-empty description string', () => {
    for (const tool of TOOLS) {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test('every tool schema has parameters with type: "object"', () => {
    for (const tool of TOOLS) {
      expect((tool.parameters as { type: string }).type).toBe('object');
    }
  });

  test('query_runs schema enumerates the status values passed and failed', () => {
    const queryRunsTool = TOOLS.find((t) => t.name === 'query_runs')!;
    const statusEnum = (queryRunsTool.parameters as {
      properties: { status: { enum: string[] } };
    }).properties.status.enum;
    expect(statusEnum).toEqual(expect.arrayContaining(['passed', 'failed']));
    expect(statusEnum).toHaveLength(2);
  });
});
