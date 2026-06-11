/**
 * Specs + Runs panel — two tables with cross-navigation.
 *
 * The Specs table shows all generated specs. Clicking a spec filters
 * the Runs table to only runs for that spec. Both tables include
 * pass/fail status badges.
 */
import { useState, type ReactElement } from 'react';
import type { Spec, Run } from './dataLayer.js';

export interface SpecsRunsPanelProps {
  specs: Spec[];
  runs: Run[];
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function RunStatusBadge({ status }: { status: Run['status'] }): ReactElement {
  const cls = status === 'green' ? 'green' : status === 'flake' ? 'amber' : 'red';
  const label = status === 'green' ? 'Green' : status === 'flake' ? 'Flake' : 'Red';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

function FlowBadge({ flow }: { flow: Run['flow'] }): ReactElement {
  return (
    <span className="badge muted">
      {flow === 'baseline' ? 'baseline' : 'bug-repro'}
    </span>
  );
}

export function SpecsRunsPanel({ specs, runs }: SpecsRunsPanelProps): ReactElement {
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'runs'>('specs');

  const filteredRuns = selectedSpecId
    ? runs.filter((r) => r.specId === selectedSpecId)
    : runs;

  const selectedSpec = specs.find((s) => s.id === selectedSpecId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
      <div className="page-header">
        <h1 className="page-title">Specs &amp; Runs</h1>
        <p className="page-subtitle">
          Generated test specs and their loop run history
          {selectedSpec && (
            <> — filtered to <strong style={{ color: 'var(--teal)' }}>{selectedSpec.testName}</strong></>
          )}
        </p>
      </div>

      {/* Tab bar */}
      <div className="tabs">
        <button
          className={`tab-btn${activeTab === 'specs' ? ' active' : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          Specs ({specs.length})
        </button>
        <button
          className={`tab-btn${activeTab === 'runs' ? ' active' : ''}`}
          onClick={() => setActiveTab('runs')}
        >
          Runs ({filteredRuns.length}{selectedSpecId ? ` / ${runs.length}` : ''})
        </button>
      </div>

      {activeTab === 'specs' && (
        <section className="section" aria-label="Specs table">
          {selectedSpecId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s2)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Filtering runs by spec —
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setSelectedSpecId(null)}
              >
                clear filter
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test name</th>
                  <th>Primitives</th>
                  <th>Runs</th>
                  <th>Pass rate</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => {
                  const specRuns = runs.filter((r) => r.specId === spec.id);
                  const passRate = specRuns.length === 0
                    ? null
                    : specRuns.filter((r) => r.status === 'green').length / specRuns.length;
                  const isSelected = spec.id === selectedSpecId;
                  return (
                    <tr
                      key={spec.id}
                      className={`clickable${isSelected ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedSpecId(isSelected ? null : spec.id);
                        setActiveTab('runs');
                      }}
                      aria-selected={isSelected}
                      title="Click to filter runs by this spec"
                    >
                      <td className="mono">{spec.testName}</td>
                      <td className="mono">{spec.primitiveCount}</td>
                      <td className="mono">{specRuns.length}</td>
                      <td>
                        {passRate === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span style={{
                            color: passRate >= 0.8 ? 'var(--green)' : passRate >= 0.5 ? 'var(--amber)' : 'var(--red)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                          }}>
                            {(passRate * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className="text-secondary" style={{ fontSize: 12 }}>
                        {formatDate(spec.generatedAt)}
                      </td>
                    </tr>
                  );
                })}
                {specs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 'var(--s6)' }}>
                      No specs generated yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'runs' && (
        <section className="section" aria-label="Runs table">
          {selectedSpecId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s2)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Showing runs for <strong style={{ color: 'var(--teal)' }}>{selectedSpec?.testName}</strong>
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setSelectedSpecId(null)}
              >
                show all
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Status</th>
                  <th>Flow</th>
                  <th>Turns to green</th>
                  <th>Duration</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{run.id}</td>
                    <td><RunStatusBadge status={run.status} /></td>
                    <td><FlowBadge flow={run.flow} /></td>
                    <td className="mono">
                      {run.turnsToGreen !== null ? (
                        <span style={{ color: 'var(--teal)' }}>{run.turnsToGreen}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="mono">{fmtMs(run.durationMs)}</td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>
                      {formatDate(run.startedAt)}
                    </td>
                  </tr>
                ))}
                {filteredRuns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: 'var(--s6)' }}>
                      No runs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
