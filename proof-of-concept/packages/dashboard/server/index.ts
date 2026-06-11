/**
 * Proxy entrypoint. Loads the server-side data layer, adapts it onto the chat
 * tool interface, and starts the chat proxy. Run with:
 *
 *     AZURE_OPENAI_API_KEY=… tsx server/index.ts
 *
 * The key is read from the process environment by the Azure client the proxy
 * builds per request; it is never written to disk or sent to the browser.
 */
import {
  resolveSource,
  type DashboardData,
  type DashboardPayload,
  type QueryRunsFilter,
} from '../src/data.js';
import { createProxyServer, CHAT_ROUTE } from './proxy.js';

/**
 * Adapt the entity payload (sessions/specs/runs) onto the chat-tool
 * {@link DashboardData} interface. Mirrors the browser's `makeChatData`, kept
 * here so the server has no React dependency.
 */
function makeChatData(payload: DashboardPayload): DashboardData {
  const runRecords = payload.runs.map((r) => ({
    id: r.id,
    spec: r.specId,
    status: r.status === 'green' ? ('passed' as const) : ('failed' as const),
    durationMs: r.durationMs,
    startedAt: r.startedAt,
  }));

  const bySpec = new Map<string, typeof runRecords>();
  for (const r of runRecords) {
    const arr = bySpec.get(r.spec) ?? [];
    arr.push(r);
    bySpec.set(r.spec, arr);
  }

  const flakySpecs = Array.from(bySpec.entries())
    .filter(([, rs]) => rs.some((r) => r.status === 'passed') && rs.some((r) => r.status === 'failed'))
    .map(([spec, rs]) => {
      const failures = rs.filter((r) => r.status === 'failed').length;
      return { spec, totalRuns: rs.length, failures, flakeRate: failures / rs.length };
    });

  const passed = runRecords.filter((r) => r.status === 'passed').length;
  const total = runRecords.length;
  const loopStats = {
    totalRuns: total,
    passed,
    failed: total - passed,
    passRate: total === 0 ? 0 : passed / total,
    avgDurationMs: total === 0 ? 0 : runRecords.reduce((s, r) => s + r.durationMs, 0) / total,
  };

  return {
    async queryRuns(filter?: QueryRunsFilter) {
      let rows = [...runRecords];
      if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
      if (filter?.spec) rows = rows.filter((r) => r.spec === filter.spec);
      if (typeof filter?.limit === 'number') rows = rows.slice(0, filter.limit);
      return rows;
    },
    async getFlakySpecs() {
      return [...flakySpecs];
    },
    async getLoopStats() {
      return { ...loopStats };
    },
  };
}

async function main(): Promise<void> {
  const port = Number(process.env.CHAT_PROXY_PORT ?? 8787);
  const payload = await resolveSource().load();
  const data = makeChatData(payload);
  const server = createProxyServer(data);
  server.listen(port, () => {
    const keyState = process.env.AZURE_OPENAI_API_KEY ? 'configured' : 'NOT configured (degrade mode)';
    // eslint-disable-next-line no-console
    console.log(`chat proxy listening on http://localhost:${port}${CHAT_ROUTE} — key ${keyState}`);
  });
}

void main();
