// The org-wide data warehouse positioning. This is THE buy-vs-build line —
// what makes the SaaS worth paying for over the free OSS library.

export const OSS_VS_SAAS = {
  oss: {
    title: 'OSS — your laptop',
    badge: 'free, MIT',
    summary:
      'Run the recorder. Run the harness. Run the spec generator. Commit the spec to your repo. Your loop, your machine, your repo. Perfect for one developer.',
    works: [
      'One developer captures a session and generates a spec — works on day one',
      'Specs land in your own repo — no vendor in the data path',
      'Free forever, MIT licensed, no account',
    ],
    limits: [
      'Each session lives only in the developer who captured it',
      'No cross-developer reuse — Engineer A and Engineer B capture the same bug twice',
      'No history — yesterday\'s sessions are gone unless someone manually saved them',
      'No queries — can\'t ask "show me all sessions where drag failed in the last quarter"',
      'No agent memory — Claude/Codex sees one session at a time, never the corpus',
    ],
  },
  saas: {
    title: 'SaaS — your org',
    badge: 'Team · Business · Enterprise',
    summary:
      'Every developer\'s sessions land in one secure, versioned, queryable corpus your whole team — and your AI tools — can tap into.',
    works: [
      'Every developer\'s captures roll up to one central, multi-tenant store',
      'Sessions are versioned against git revisions so you can replay a year-old bug on today\'s code',
      'Processed into derived data: per-component failure rates, bug-class clusters, generated-spec accept/reject signals',
      'Queryable via dashboard, REST API, or MCP — for humans and agents both',
      'Encrypted at rest with per-tenant KMS keys, SOC 2 Type II posture',
    ],
    limits: [
      '$499/mo Team tier and up — see /pricing',
      'Requires you to install the recorder extension on developer machines',
    ],
  },
};

export const DATA_WAREHOUSE_CAPABILITIES = [
  {
    icon: 'corpus',
    title: 'Every session, one place',
    body:
      'Engineer A captures a drag bug Monday. Engineer B reproduces it Tuesday. Both sessions land in the same tenant corpus, deduped, linked to the same issue. No more "did anyone else see this?" Slack threads.',
  },
  {
    icon: 'version',
    title: 'Versioned against your code',
    body:
      'Every session is tagged with the git SHA at capture time. Replay yesterday\'s sessions on today\'s code to find which deploy introduced a regression. Walk backwards through the corpus to find when a behavior changed.',
  },
  {
    icon: 'processed',
    title: 'Processed, not just stored',
    body:
      'We extract per-tenant signal from the raw sessions: a selector dictionary of your stable component names, a bug-class corpus of every accepted/rejected spec, per-component flake rates. Your AI tools query the derived data, not the raw bytes.',
  },
  {
    icon: 'query',
    title: 'Queryable QA insights',
    body:
      'Ask: "Show me every session in the last 30 days where waveform drag failed." "Which components have the highest reopen rate?" "Cluster bugs by failure mode — top 5." Get answers in the dashboard, via REST API, or via Claude Code through MCP.',
  },
];

export const THREE_TAPS = [
  {
    name: '/cuit-loop · the skill',
    surface: 'Claude Code skill (.claude/skills/cuit-loop/SKILL.md)',
    use: 'For a single-session loop. Drop a session, agent walks Flow A or Flow B, opens a PR with the regression spec.',
    example: '/cuit-loop ./cuit-session-2014.json',
    docHref: 'https://github.com/speechlabinc/complex-ui-tester/blob/main/.claude/skills/cuit-loop/SKILL.md',
  },
  {
    name: 'POST /v1/specs/generate · the REST API',
    surface: 'HTTPS REST · Bearer auth · OpenAPI 3.1 spec published',
    use: 'For batch and integration work. CI gates that auto-generate specs from PR-attached sessions; webhook integrations; team-internal tooling that pulls from the corpus.',
    example: 'curl -X POST https://api.cuit.dev/v1/specs/generate -d @session.json',
    docHref: 'https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/12-qa-data-warehouse.md#5-rest-api',
  },
  {
    name: 'cuit-mcp · the MCP server',
    surface: 'Model Context Protocol server · exposes 8 tools to any MCP client',
    use: 'For deep investigation. Claude Code, Cursor, Aider can query the corpus mid-task: similar bugs, flake rates, per-component history — without leaving the agent loop.',
    example: 'mcp__cuit__query_sessions({ predicate: "type=drag-fail AND ts>30d" })',
    docHref: 'https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/12-qa-data-warehouse.md#6-mcp-server',
  },
];

export const EXAMPLE_QUERIES = [
  {
    natural: 'Show me every session in the last 30 days where waveform drag failed.',
    asMcp: `mcp__cuit__query_sessions({
  tenant: 'acme-corp',
  predicate: "interaction='drag' AND outcome='red' AND ts > now-30d",
  limit: 50
})`,
    asApi: `GET /v1/sessions?interaction=drag&outcome=red&since=30d`,
  },
  {
    natural: 'Which UI components have the highest reopen rate this quarter?',
    asMcp: `mcp__cuit__bug_class_distribution({
  groupBy: 'component',
  metric: 'reopen_rate',
  since: 'q-current'
})`,
    asApi: `GET /v1/insights/bug-classes?groupBy=component&metric=reopen_rate&since=q-current`,
  },
  {
    natural:
      'Find sessions similar to this one — anyone already filed this bug?',
    asMcp: `mcp__cuit__find_similar_sessions({
  reference: sessionId,
  threshold: 0.85
})`,
    asApi: `POST /v1/sessions/${'$'}{id}/similar?threshold=0.85`,
  },
];
