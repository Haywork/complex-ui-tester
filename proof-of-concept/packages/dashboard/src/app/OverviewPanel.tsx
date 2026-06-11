/**
 * Overview / Monitoring panel — loop telemetry stat cards.
 *
 * Metrics derived directly from LoopTelemetry + entity counts so every
 * number is grounded in real fixture data.
 */
import type { ReactElement } from 'react';
import type { LoopTelemetry, Session, Spec, Run } from './dataLayer.js';

export interface OverviewPanelProps {
  telemetry: LoopTelemetry;
  sessions: Session[];
  specs: Spec[];
  runs: Run[];
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function fmtTurns(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1);
}

function PassRateBar({ rate }: { rate: number }): ReactElement {
  const pct = Math.max(0, Math.min(1, rate));
  const color = pct >= 0.9 ? 'var(--green)' : pct >= 0.6 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="progress-bar-track" aria-label={`Pass rate ${fmtPct(pct)}`}>
      <div
        className="progress-bar-fill"
        style={{ width: `${pct * 100}%`, background: color }}
      />
    </div>
  );
}

function RecentRuns({ runs }: { runs: Run[] }): ReactElement {
  const recent = [...runs]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 20);

  return (
    <div className="run-mini-bar" aria-label="Recent run history">
      {recent.map((r) => (
        <div
          key={r.id}
          className={`run-mini-bar-segment ${r.status === 'green' ? 'green' : r.status === 'flake' ? 'amber' : 'red'}`}
          title={`${r.id}: ${r.status} (${fmtMs(r.durationMs)})`}
        />
      ))}
      {recent.length === 0 && (
        <span className="text-muted" style={{ fontSize: 12 }}>No runs yet</span>
      )}
    </div>
  );
}

export function OverviewPanel({ telemetry, sessions, specs, runs }: OverviewPanelProps): ReactElement {
  const greenCount = runs.filter((r) => r.status === 'green').length;
  const redCount   = runs.filter((r) => r.status === 'red').length;
  const flakeCount = runs.filter((r) => r.status === 'flake').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
      <div className="page-header">
        <h1 className="page-title">Loop Monitor</h1>
        <p className="page-subtitle">
          Aggregate agentic-loop telemetry — fixture data, zero backend
        </p>
      </div>

      {/* Primary stat cards */}
      <section aria-label="Loop statistics">
        <div className="stat-grid">
          <div className="stat-card accent">
            <span className="stat-label">Pass rate</span>
            <span className="stat-value teal">{fmtPct(telemetry.passRate)}</span>
            <PassRateBar rate={telemetry.passRate} />
          </div>

          <div className="stat-card">
            <span className="stat-label">Total runs</span>
            <span className="stat-value">{telemetry.totalRuns}</span>
            <span className="stat-delta">{greenCount} green · {redCount} red · {flakeCount} flake</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Avg turns to green</span>
            <span className={`stat-value ${telemetry.avgTurnsToGreen === null ? 'text-muted' : 'teal'}`}>
              {fmtTurns(telemetry.avgTurnsToGreen)}
            </span>
            <span className="stat-delta">mean over green runs</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Flake rate</span>
            <span className={`stat-value ${telemetry.flakeRate > 0.1 ? 'amber' : ''}`}>
              {fmtPct(telemetry.flakeRate)}
            </span>
            <span className="stat-delta">{flakeCount} flaky run{flakeCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Sessions</span>
            <span className="stat-value">{sessions.length}</span>
            <span className="stat-delta">recorded</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Specs</span>
            <span className="stat-value">{specs.length}</span>
            <span className="stat-delta">generated</span>
          </div>
        </div>
      </section>

      {/* Recent run history bar */}
      <section className="section" aria-label="Recent runs history">
        <div className="section-header">
          <span className="section-title">Recent run history</span>
          <span className="text-muted" style={{ fontSize: 12 }}>newest → oldest</span>
        </div>
        <div
          className="table-wrap"
          style={{ padding: 'var(--s4) var(--s5)' }}
        >
          <RecentRuns runs={runs} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--s2)' }}>
            Each bar = one run.{' '}
            <span style={{ color: 'var(--green)' }}>Green</span> ={' '}
            loop resolved.{' '}
            <span style={{ color: 'var(--amber)' }}>Amber</span> = flake.{' '}
            <span style={{ color: 'var(--red)' }}>Red</span> = failed.
          </p>
        </div>
      </section>

      {/* Per-spec breakdown */}
      <section className="section" aria-label="Per-spec breakdown">
        <div className="section-header">
          <span className="section-title">Per-spec breakdown</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Spec</th>
                <th>Runs</th>
                <th>Green</th>
                <th>Red</th>
                <th>Flake</th>
                <th>Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => {
                const specRuns = runs.filter((r) => r.specId === spec.id);
                const g = specRuns.filter((r) => r.status === 'green').length;
                const r = specRuns.filter((r) => r.status === 'red').length;
                const f = specRuns.filter((r) => r.status === 'flake').length;
                const pr = specRuns.length === 0 ? 0 : g / specRuns.length;
                return (
                  <tr key={spec.id}>
                    <td className="mono truncate" style={{ maxWidth: 200 }}>{spec.testName}</td>
                    <td>{specRuns.length}</td>
                    <td style={{ color: 'var(--green)' }}>{g}</td>
                    <td style={{ color: 'var(--red)' }}>{r}</td>
                    <td style={{ color: 'var(--amber)' }}>{f}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                        <div style={{ width: 60 }}>
                          <PassRateBar rate={pr} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {fmtPct(pr)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {specs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: 'var(--s6)' }}>
                    No specs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
