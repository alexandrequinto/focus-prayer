// Blocking engine — wraps chrome.declarativeNetRequest
// Rules are generated dynamically from the session's block list.

const RULE_ID_START = 1000; // offset to avoid collisions with static rules
const BLOCKED_PAGE = chrome.runtime.getURL('blocked/blocked.html');

export async function applyBlockRules(domains = [], exceptions = []) {
  const active = domains.filter((d) => !exceptions.includes(d));

  // Remove all existing dynamic rules first
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);

  const addRules = active.map((domain, i) => ({
    id: RULE_ID_START + i,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { url: BLOCKED_PAGE },
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ['main_frame'],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules,
  });
}

export async function clearBlockRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map((r) => r.id);
  if (removeIds.length === 0) return;
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
}
