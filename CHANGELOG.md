# Changelog

## [0.2.0] — 2026-06-30

### Features
- feat: setup publish package to github registry (sha: abb2335)
- feat: setup publish package to github registry (sha: d3c9543)
- feat: loadable MV3 recorder extension (record->export SessionEvent[]) + dashboard gpt-5.5 chat proxy (browser-safe live chat) (sha: 50b4a81)
- feat(dashboard): OSS monitoring + data-browsing dashboard with LLM-native chat (gpt-5.5) (sha: d123c84)

### Bug Fixes
- fix(hero): tighten oversized top gap (pt-40 -> pt-28) under the fixed header (sha: 796cdbb)
- fix(dashboard): live gpt-5.5 chat — Azure Responses API rejects role:'tool' (sha: 7b9c725)
- fix(dashboard): chat degrades gracefully in browser (was 'process is not defined') (sha: ca43272)
- fix(spec-gen): proof:agent-loop GREEN again — deriveAssert falls back to post-snapshot + prefers numeric path (sha: 6e1d028)
- fix: /quickstart now MCP + Claude Code first; REST/curl banished to collapsed fallback (sha: e748159)

### Tests
- test(visual): dogfood UI feedback loop on our own site — visual-regression smoke + theme guard (sha: 04ed625)

### Infra / CI
- ci: add marketing-site auto-deploy workflow to Vercel (sha: e8f5cd0)

