// Session state — persisted in chrome.storage.local
// Shape: { intention, durationMinutes, blockList, startedAt, endedAt, status, sins[], tempUnblocked[] }

const KEY = 'focus_session';

export async function getSession() {
  const result = await chrome.storage.local.get(KEY);
  return result[KEY] || null;
}

export async function saveSession(session) {
  await chrome.storage.local.set({ [KEY]: session });
}

export async function clearSession() {
  await chrome.storage.local.remove(KEY);
}

export function isActive(session) {
  return session && session.status === 'active';
}

export function timeRemainingMs(session) {
  if (!session) return 0;
  const elapsed = Date.now() - session.startedAt;
  const total = session.durationMinutes * 60 * 1000;
  return Math.max(0, total - elapsed);
}
