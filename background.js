// Focus Prayer — Background Service Worker
// Manages session state, blocking rules, and alarms.

import { getSession, saveSession, clearSession, timeRemainingMs } from './src/session.js';
import { applyBlockRules, clearBlockRules } from './src/blocker.js';
import { archiveSession } from './src/history.js';

// --- Restart recovery ---

chrome.runtime.onStartup.addListener(async () => {
  const session = await getSession();
  if (!session || session.status !== 'active') return;

  const remaining = timeRemainingMs(session);
  if (remaining <= 0) {
    await endSession();
    return;
  }

  // Restore block rules and alarm after Chrome restart
  await applyBlockRules(session.blockList, session.tempUnblocked || []);
  chrome.alarms.create('focus-prayer-session-end', {
    delayInMinutes: remaining / 60000,
  });
});

// --- Session lifecycle ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focus-prayer-session-end') {
    await endSession();
  }
});

export async function startSession(session) {
  await saveSession(session);
  await applyBlockRules(session.blockList);
  chrome.alarms.create('focus-prayer-session-end', {
    delayInMinutes: session.durationMinutes,
  });
}

export async function endSession() {
  const session = await getSession();
  if (!session) return;

  await clearBlockRules();
  chrome.alarms.clear('focus-prayer-session-end');

  const completed = { ...session, status: 'complete', endedAt: Date.now() };
  await archiveSession(completed);
  // Keep in active slot so popup can render the summary, then user dismisses
  await saveSession(completed);
}

export async function commitSin(domain) {
  const session = await getSession();
  if (!session) return;

  const sins = session.sins || [];
  sins.push({ domain, at: Date.now() });

  const tempUnblocked = [...new Set([...(session.tempUnblocked || []), domain])];
  await saveSession({ ...session, sins, tempUnblocked });
  await applyBlockRules(session.blockList, tempUnblocked);
}

// --- Message router ---

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'START_SESSION':
        await startSession(msg.session);
        sendResponse({ ok: true });
        break;
      case 'END_SESSION':
        await endSession();
        sendResponse({ ok: true });
        break;
      case 'CLEAR_SESSION':
        await clearSession();
        sendResponse({ ok: true });
        break;
      case 'COMMIT_SIN':
        await commitSin(msg.domain);
        sendResponse({ ok: true });
        break;
      case 'GET_SESSION':
        sendResponse(await getSession());
        break;
      default:
        sendResponse({ error: 'unknown message type' });
    }
  })();
  return true; // async response
});
