"use client";

/**
 * CuitFunnelInstrument — mounts `window.__cuitDebug` for the CUIT dogfood bot.
 *
 * Responsibilities:
 * - Exposes `window.__cuitDebug.getState()` returning a `CuitFunnelState`.
 * - Listens for custom DOM events fired by instrumented components
 *   (`cuit:signupFormStarted`, `cuit:signupTokenIssued`,
 *   `cuit:quickstartCopyClicked`, `cuit:exampleExpanded`).
 * - Observes route changes (popstate + Next.js navigation) to keep
 *   `state.route` current.
 * - Gate: renders nothing and sets up nothing unless `isCuitActive()`.
 *
 * Mount this component once, high in the tree (e.g. in layout.tsx).
 * It renders null — no DOM output.
 */

import { useEffect } from "react";
import {
  getFunnelState,
  isCuitActive,
  setFunnelState,
  type CuitFunnelState,
} from "./funnel-state";

/* ------------------------------------------------------------------ */
/* Window type augmentation                                             */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    /**
     * CUIT debug handle injected by CuitFunnelInstrument.
     * Only present when `isCuitActive()` returns true.
     */
    __cuitDebug?: {
      /** Returns a snapshot of the current funnel state. */
      getState(): CuitFunnelState;
    };
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function CuitFunnelInstrument() {
  useEffect(() => {
    if (!isCuitActive()) return;

    // Expose the debug handle.
    window.__cuitDebug = {
      getState: getFunnelState,
    };

    // --- route tracking via popstate and a MutationObserver on <title> ---
    function syncRoute() {
      setFunnelState({ route: window.location.pathname });
    }

    window.addEventListener("popstate", syncRoute);

    // Next.js App Router uses history.pushState / history.replaceState directly.
    // Patch them so navigation updates our route field.
    const _push = history.pushState.bind(history);
    const _replace = history.replaceState.bind(history);

    history.pushState = function (...args) {
      _push(...args);
      syncRoute();
    };

    history.replaceState = function (...args) {
      _replace(...args);
      syncRoute();
    };

    // --- custom event listeners fired by instrumented components ---
    function onSignupFormStarted() {
      setFunnelState({ signupFormStarted: true });
    }
    function onSignupTokenIssued() {
      setFunnelState({ signupTokenIssued: true });
    }
    function onQuickstartCopyClicked() {
      setFunnelState({ quickstartCopyClicked: true });
    }
    function onExampleExpanded() {
      setFunnelState({ exampleExpanded: true });
    }

    window.addEventListener("cuit:signupFormStarted", onSignupFormStarted);
    window.addEventListener("cuit:signupTokenIssued", onSignupTokenIssued);
    window.addEventListener("cuit:quickstartCopyClicked", onQuickstartCopyClicked);
    window.addEventListener("cuit:exampleExpanded", onExampleExpanded);

    /**
     * Delegated toggle listener: catches <details data-cuit-example> open events.
     * `toggle` does not bubble, so we use capture phase.
     */
    function onDetailsToggle(e: Event) {
      const target = e.target;
      if (
        target instanceof HTMLDetailsElement &&
        target.hasAttribute("data-cuit-example") &&
        target.open
      ) {
        setFunnelState({ exampleExpanded: true });
      }
    }

    document.addEventListener("toggle", onDetailsToggle, { capture: true });

    return () => {
      delete window.__cuitDebug;
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("cuit:signupFormStarted", onSignupFormStarted);
      window.removeEventListener("cuit:signupTokenIssued", onSignupTokenIssued);
      window.removeEventListener("cuit:quickstartCopyClicked", onQuickstartCopyClicked);
      window.removeEventListener("cuit:exampleExpanded", onExampleExpanded);
      document.removeEventListener("toggle", onDetailsToggle, { capture: true });

      // Restore original history methods.
      history.pushState = _push;
      history.replaceState = _replace;
    };
  }, []);

  // No DOM output — purely side-effect.
  return null;
}
