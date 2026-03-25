// Session history — capped archive of completed sessions

const HISTORY_KEY = 'focus_history';
const MAX_SESSIONS = 50;

export async function archiveSession(session) {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  const history = result[HISTORY_KEY] || [];
  history.unshift(session);
  if (history.length > MAX_SESSIONS) history.splice(MAX_SESSIONS);
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

export async function getHistory() {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return result[HISTORY_KEY] || [];
}
