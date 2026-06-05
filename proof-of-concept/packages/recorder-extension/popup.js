// popup.js — drives content.js via chrome.scripting.executeScript.

const $ = (id) => document.getElementById(id);
const statusDot = $('status-dot');
const statusText = $('status-text');
const startBtn = $('start');
const stopBtn = $('stop');
const copyBtn = $('copy');
const downloadBtn = $('download');
const statEvents = $('stat-events');
const statDebug = $('stat-debug');
const toast = $('toast');

let lastSession = null;
let pollHandle = null;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.add('show');
  toast.classList.toggle('error', isError);
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

async function currentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function callRecorder(method, ...args) {
  const tab = await currentTab();
  if (!tab?.id) return null;
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    args: [method, args],
    func: (fnName, fnArgs) => {
      if (!window.__cuitRecorder) return { ok: false, error: 'recorder-not-installed' };
      const fn = window.__cuitRecorder[fnName];
      if (typeof fn !== 'function') return { ok: false, error: 'unknown-method' };
      return fn(...fnArgs);
    },
  });
  return result?.result ?? null;
}

async function refreshStatus() {
  const tab = await currentTab();
  if (!tab?.id) return;
  if (tab.url?.startsWith('chrome://')) {
    statusDot.className = 'dot warn';
    statusText.textContent = 'chrome:// pages can’t be recorded';
    startBtn.disabled = true;
    return;
  }
  const status = await callRecorder('status');
  if (!status || status.error === 'recorder-not-installed') {
    statusDot.className = 'dot warn';
    statusText.textContent = 'recorder not installed (reload tab)';
    startBtn.disabled = true;
    stopBtn.disabled = true;
    return;
  }
  if (status.recording) {
    statusDot.className = 'dot live';
    statusText.textContent = `recording — ${status.sessionId}`;
    statEvents.textContent = String(status.eventCount ?? 0);
    statDebug.textContent = status.hasCuitDebug ? 'present' : 'missing';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusDot.className = status.hasCuitDebug ? 'dot ok' : 'dot warn';
    statusText.textContent = 'idle';
    statDebug.textContent = status.hasCuitDebug ? 'present' : 'missing';
    if (statEvents.textContent === '—') statEvents.textContent = '0';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
  copyBtn.disabled = lastSession === null;
  downloadBtn.disabled = lastSession === null;
}

startBtn.addEventListener('click', async () => {
  const sessionId = `cuit-${Date.now()}`;
  const r = await callRecorder('start', { sessionId });
  if (r?.ok) {
    showToast(`recording → ${r.sessionId}`);
    lastSession = null;
    statEvents.textContent = '0';
    pollHandle = setInterval(refreshStatus, 400);
  } else {
    showToast(r?.error ?? 'failed to start', true);
  }
  refreshStatus();
});

stopBtn.addEventListener('click', async () => {
  const r = await callRecorder('stop');
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
  if (r?.ok) {
    lastSession = r.session;
    showToast(`stopped — ${r.session.events.length} events captured`);
    statEvents.textContent = String(r.session.events.length);
  } else {
    showToast(r?.error ?? 'failed to stop', true);
  }
  refreshStatus();
});

copyBtn.addEventListener('click', async () => {
  if (!lastSession) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastSession, null, 2));
    showToast('JSON copied — paste into Claude Code or `pnpm cuit gen`');
  } catch (err) {
    showToast(String(err), true);
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!lastSession) return;
  const blob = new Blob([JSON.stringify(lastSession, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  await chrome.downloads.download({
    url,
    filename: `cuit-session-${lastSession.sessionId}.json`,
    saveAs: true,
  });
  showToast('downloaded');
});

refreshStatus();
