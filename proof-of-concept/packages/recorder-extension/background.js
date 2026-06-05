// background.js — MV3 service worker.
// Currently a no-op shell. The recorder lives in content.js (MAIN world)
// so it can read window.__cuitDebug directly; the popup drives it via
// chrome.scripting.executeScript. Add tab-state badge updates here later.

chrome.runtime.onInstalled.addListener(() => {
  // Future: persist recordings to chrome.storage, ship to localhost for
  // closed-loop integration with claude-code / codex CLI.
});
