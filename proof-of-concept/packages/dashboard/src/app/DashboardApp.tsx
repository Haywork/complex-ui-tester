/**
 * DashboardApp — top-level shell component.
 *
 * Layout: 3-column grid:
 *   - Left:   200px side nav
 *   - Center: scrollable main content (page panels)
 *   - Right:  360px docked chat panel
 *
 * Data is loaded once from the fixture source (or API when configured) and
 * passed down as props — no context or global store needed at this scale.
 */
import { useState, type ReactElement } from 'react';
import { useDashboardData, makeChatData } from './useData.js';
import { OverviewPanel } from './OverviewPanel.js';
import { SessionsPanel } from './SessionsPanel.js';
import { SpecsRunsPanel } from './SpecsRunsPanel.js';
import { ChatPanel } from './ChatPanel.js';

type PageId = 'overview' | 'sessions' | 'specs-runs';

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactElement;
}

function IconOverview(): ReactElement {
  return (
    <svg className="nav-item-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function IconSessions(): ReactElement {
  return (
    <svg className="nav-item-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function IconSpecs(): ReactElement {
  return (
    <svg className="nav-item-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M5 6h6M5 8.5h4M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',   label: 'Overview',      icon: <IconOverview /> },
  { id: 'sessions',   label: 'Sessions',      icon: <IconSessions /> },
  { id: 'specs-runs', label: 'Specs & Runs',  icon: <IconSpecs /> },
];

function LoadingShell(): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 'var(--s3)',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="chat-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span style={{ fontSize: 13 }}>Loading fixture data…</span>
    </div>
  );
}

function ErrorShell({ message }: { message: string }): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 'var(--s3)',
        color: 'var(--text-secondary)',
        padding: 'var(--s6)',
      }}
    >
      <span style={{ fontSize: 24 }}>⚠</span>
      <p style={{ color: 'var(--red)', fontSize: 14 }}>Failed to load dashboard data</p>
      <pre style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {message}
      </pre>
    </div>
  );
}

export function DashboardApp(): ReactElement {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const { loading, error, sessions, specs, runs, telemetry } = useDashboardData();

  if (loading) return <LoadingShell />;
  if (error) return <ErrorShell message={error} />;

  const chatData = makeChatData({ sessions, specs, runs });

  function renderPage(): ReactElement {
    switch (activePage) {
      case 'overview':
        return <OverviewPanel telemetry={telemetry} sessions={sessions} specs={specs} runs={runs} />;
      case 'sessions':
        return <SessionsPanel sessions={sessions} specs={specs} />;
      case 'specs-runs':
        return <SpecsRunsPanel specs={specs} runs={runs} />;
      default: {
        const _exhaustive: never = activePage;
        throw new Error(`Unknown page: ${String(_exhaustive)}`);
      }
    }
  }

  return (
    <div className="shell">
      {/* Top bar */}
      <header className="topbar" role="banner">
        <a className="topbar-logo" href="/" aria-label="CUIT Dashboard home">
          <div className="topbar-logo-mark" aria-hidden="true">C</div>
          CUIT Dashboard
        </a>
        <span className="topbar-badge">OSS</span>
        <span className="topbar-spacer" />
        <span className="topbar-fixture-note">
          {sessions.length} sessions · {specs.length} specs · {runs.length} runs
        </span>
      </header>

      {/* Side nav */}
      <nav className="sidenav" aria-label="Dashboard navigation">
        <span className="nav-section-label">Monitor</span>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => setActivePage(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="main" id="main-content" role="main" aria-label="Dashboard content">
        {renderPage()}
      </main>

      {/* Docked chat */}
      <ChatPanel data={chatData} />
    </div>
  );
}
