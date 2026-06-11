/**
 * CUIT funnel instrumentation — shared state singleton.
 *
 * This module is the single source of truth for the funnel state object that
 * the dogfood bot reads via `window.__cuitDebug.getState()`.
 *
 * Gating: only active when `isCuitActive()` returns true (dev builds or
 * `?cuitRecorder=1` in the URL).  All callers must check the gate before
 * touching this module's exports.
 */

/** Shape of the funnel state reported to the CUIT recorder. */
export interface CuitFunnelState {
  /** Current pathname, e.g. "/signup" or "/quickstart". */
  route: string;
  /** True after any signup-form input receives focus. */
  signupFormStarted: boolean;
  /** True after the API returns a token and the success panel renders. */
  signupTokenIssued: boolean;
  /** True after the "Copy token to clipboard" button is clicked. */
  quickstartCopyClicked: boolean;
  /** True after any expandable example section is toggled open. */
  exampleExpanded: boolean;
}

const _state: CuitFunnelState = {
  route: typeof window !== "undefined" ? window.location.pathname : "",
  signupFormStarted: false,
  signupTokenIssued: false,
  quickstartCopyClicked: false,
  exampleExpanded: false,
};

/** Read a snapshot of the current funnel state. */
export function getFunnelState(): Readonly<CuitFunnelState> {
  if (typeof window !== "undefined") {
    _state.route = window.location.pathname;
  }
  return { ..._state };
}

/** Merge a partial update into the funnel state. */
export function setFunnelState(patch: Partial<CuitFunnelState>): void {
  Object.assign(_state, patch);
}

/**
 * Returns true when CUIT instrumentation should be active.
 *
 * Active when:
 * - `NODE_ENV !== "production"` (dev / test builds), OR
 * - the URL query string contains `cuitRecorder=1`.
 *
 * We deliberately evaluate the URL at call-time so that a user navigating to
 * `?cuitRecorder=1` mid-session will activate the recorder without a reload.
 */
export function isCuitActive(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("cuitRecorder") === "1";
}
