/**
 * Sessions browser panel — list of recorded sessions + event detail view.
 *
 * Selecting a session in the list shows its metadata and a synthetic
 * event list (click / input / navigate primitives) derived from the
 * fixture's eventCount. Real adapters would supply actual event arrays;
 * for the OSS demo we generate representative events from the count so
 * the UI is fully exercisable offline.
 */
import { useState, type ReactElement } from 'react';
import type { Session, Spec } from './dataLayer.js';

export interface SessionsPanelProps {
  sessions: Session[];
  specs: Spec[];
}

const VENDOR_LABELS: Record<string, string> = {
  cuit: 'CUIT',
  jam: 'Jam',
  logrocket: 'LogRocket',
  'sentry-replay': 'Sentry Replay',
  fullstory: 'FullStory',
  'datadog-rum': 'Datadog RUM',
};

const EVENT_TYPES = ['click', 'input', 'navigate', 'scroll', 'keydown', 'focus', 'blur', 'submit'];
const EVENT_TARGETS = [
  'button[data-id="export"]',
  'input[name="language"]',
  '[data-testid="segment-seg-0"]',
  '[data-testid="waveform-track"]',
  'nav a[href="/translate"]',
  'button[aria-label="Play"]',
  '[data-testid="timeline-container"]',
  'select[name="dub-language"]',
];

/** Synthetic event list derived from eventCount for demo purposes. */
function generateEvents(session: Session): Array<{ type: string; target: string }> {
  // Deterministic seed-based generation so events are stable across renders.
  const hash = session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: Math.min(session.eventCount, 30) }, (_, i) => ({
    type: EVENT_TYPES[(hash + i * 3) % EVENT_TYPES.length] ?? 'click',
    target: EVENT_TARGETS[(hash + i * 5) % EVENT_TARGETS.length] ?? 'button',
  }));
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

function VendorBadge({ vendor }: { vendor: string }): ReactElement {
  return (
    <span className="badge muted">
      {VENDOR_LABELS[vendor] ?? vendor}
    </span>
  );
}

function SessionDetail({ session, specs }: { session: Session; specs: Spec[] }): ReactElement {
  const events = generateEvents(session);
  const sessionSpecs = specs.filter((s) => s.sessionId === session.id);

  return (
    <div className="detail-panel">
      <div className="detail-heading">{session.title}</div>

      <div className="detail-meta">
        <div className="detail-meta-item">
          <span className="detail-meta-label">Vendor</span>
          <span className="detail-meta-value"><VendorBadge vendor={session.vendor} /></span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Recorded at</span>
          <span className="detail-meta-value">{formatDate(session.recordedAt)}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Events</span>
          <span className="detail-meta-value">{session.eventCount}</span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">URL</span>
          <span className="detail-meta-value" style={{ color: 'var(--teal)', fontSize: 11 }}>
            {session.url}
          </span>
        </div>
        <div className="detail-meta-item">
          <span className="detail-meta-label">Specs generated</span>
          <span className="detail-meta-value">{sessionSpecs.length}</span>
        </div>
      </div>

      {sessionSpecs.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
            Generated specs
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s1)' }}>
            {sessionSpecs.map((spec) => (
              <div
                key={spec.id}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r1)',
                  padding: 'var(--s2) var(--s3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s2)',
                }}
              >
                <span style={{ color: 'var(--teal)', fontSize: 10 }}>SPEC</span>
                <span className="mono truncate" style={{ flex: 1 }}>{spec.testName}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{spec.primitiveCount} primitives</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--s2)' }}>
          Events (showing {events.length} of {session.eventCount})
        </p>
        <div className="event-list" role="list" aria-label="Session events">
          {events.map((ev, i) => (
            <div key={i} className="event-item" role="listitem">
              <span className="event-index">#{i + 1}</span>
              <span className="event-type">{ev.type}</span>
              <span className="event-target">{ev.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SessionsPanel({ sessions, specs }: SessionsPanelProps): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(
    sessions.length > 0 ? (sessions[0]?.id ?? null) : null,
  );

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <p className="page-subtitle">
          Recorded user sessions — select a row to inspect events
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)', alignItems: 'start' }}>
        {/* Session list */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Vendor</th>
                  <th>Events</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`clickable${session.id === selectedId ? ' selected' : ''}`}
                    onClick={() => setSelectedId(session.id)}
                    aria-selected={session.id === selectedId}
                  >
                    <td className="truncate" style={{ maxWidth: 140 }}>{session.title}</td>
                    <td><VendorBadge vendor={session.vendor} /></td>
                    <td className="mono">{session.eventCount}</td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>
                      {formatDate(session.recordedAt)}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: 'var(--s6)' }}>
                      No sessions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail view */}
        <div>
          {selectedSession ? (
            <SessionDetail session={selectedSession} specs={specs} />
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">↑</span>
              <span>Select a session to inspect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
