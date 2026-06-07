# Decision

- **INVOKE SKILL: NO** (no CUIT skill is currently loaded in this session; `cuit-instrument` is not in the available skills list for this thread)

- **REASONING:** The user is explicitly asking to wire up CUIT into a Remix customer portal, which is exactly the use case `cuit-instrument` is designed for. However, that skill is not present in my available skills list right now, so I cannot invoke it. I'll answer directly from general knowledge of CUIT's instrumentation pattern (recorder bridge, `window.__cuitDebug`, GitHub Action, round-trip verification) and Remix specifics. The "no state lib, just props + Context" setup is not a blocker — CUIT's recorder captures DOM events and React render trees, so it works fine without Redux/Zustand; Context providers are picked up automatically as part of the React tree.

- **WHAT I'D DO NEXT:**
  1. Confirm Remix version and whether `apps/portal` is client-rendered or uses SSR/loaders (affects where the recorder bridge mounts — needs to be client-only, typically in `entry.client.tsx` or a `ClientOnly` wrapper in `root.tsx`).
  2. Install `@cuit/recorder` + dev bridge, mount `window.__cuitDebug` in `entry.client.tsx`, and add a Context-tagging helper so recorded sessions annotate which Context provider owned each interaction (improves spec-gen quality without a formal state lib).
  3. Drop in the CUIT GitHub Action workflow and run a round-trip test session (record a simple flow, generate spec via `@cuit/spec-gen`, verify it passes) to confirm wiring before broader rollout.
