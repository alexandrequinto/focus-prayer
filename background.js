// Focus Prayer — Background Service Worker
// Manages session state, blocking rules, and alarms.

import { getSession, saveSession, clearSession } from './src/session.js';
import { applyBlockRules, clearBlockRules } from './src/blocker.js';

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

  // Mark session as complete, preserve for summary
  await saveSession({ ...session, status: 'complete', endedAt: Date.now() });
}

export async function commitSin(domain) {
  const session = await getSession();
  if (!session) return;

  const sins = session.sins || [];
  sins.push({ domain, at: Date.now() });

  // Temporarily unblock this domain for the session
  await saveSession({ ...session, sins, tempUnblocked: [...(session.tempUnblocked || []), domain] });
  await applyBlockRules(session.blockList, session.tempUnblocked || []);
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
