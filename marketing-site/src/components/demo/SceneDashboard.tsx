export function SceneDashboard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-2">
        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
          app.complex-ui-tester.com · Sessions
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)]">
          acme-corp
        </span>
      </div>
      <div className="p-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[var(--text-tertiary)] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-2 pr-2">Vendor</th>
              <th className="py-2 px-2">Session</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Duration</th>
              <th className="py-2 pl-2 text-right">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            <tr className="bg-[var(--color-accent)]/[0.04]">
              <td className="py-2 pr-2 font-mono text-[var(--color-accent)]">Jam</td>
              <td className="py-2 px-2 font-mono text-[var(--text-primary)]">
                JAM-2014
              </td>
              <td className="py-2 px-2">
                <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  normalizing → specced
                </span>
              </td>
              <td className="py-2 px-2 font-mono text-[var(--text-secondary)]">4m 12s</td>
              <td className="py-2 pl-2 text-right text-[var(--text-tertiary)]">now</td>
            </tr>
            {[
              ["LogRocket", "lr-9af2c1", "GREEN", "2m 48s", "3h"],
              ["Sentry", "evt-1923", "GREEN", "6m 03s", "5h"],
              ["Jam", "JAM-2013", "GREEN", "3m 41s", "1d"],
            ].map(([vendor, sess, status, dur, age]) => (
              <tr key={sess}>
                <td className="py-2 pr-2 font-mono text-[var(--text-secondary)]">{vendor}</td>
                <td className="py-2 px-2 font-mono text-[var(--text-tertiary)]">{sess}</td>
                <td className="py-2 px-2">
                  <span className="inline-flex items-center gap-1.5 text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {status}
                  </span>
                </td>
                <td className="py-2 px-2 font-mono text-[var(--text-tertiary)]">{dur}</td>
                <td className="py-2 pl-2 text-right text-[var(--text-tertiary)]">{age}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Selector dictionary", "412 entries"],
            ["Bug-class corpus", "89 specs"],
            ["Custom primitives", "3"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3 py-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">
                {k}
              </div>
              <div className="font-mono text-xs text-[var(--text-primary)]">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
