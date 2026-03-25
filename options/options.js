import { PRESETS, getBlockList, saveCustomization } from '../src/blockLists.js';
import { getHistory } from '../src/history.js';

(async () => {
  await buildPresetPanels();
  await buildSinHistory();
})();

// --- Block list panels ---

async function buildPresetPanels() {
  const container = document.getElementById('preset-panels');

  for (const [key, preset] of Object.entries(PRESETS)) {
    const domains = await getBlockList(key);
    const customData = await getCustomData(key);

    const panel = document.createElement('div');
    panel.className = 'preset-panel';

    const header = document.createElement('div');
    header.className = 'preset-header';
    header.innerHTML = `
      <span class="preset-title">${preset.label}</span>
      <span class="preset-toggle">▸</span>
    `;

    const body = document.createElement('div');
    body.className = 'preset-body hidden';
    body.innerHTML = buildDomainList(key, domains, customData);

    header.addEventListener('click', () => {
      body.classList.toggle('hidden');
      header.querySelector('.preset-toggle').textContent = body.classList.contains('hidden') ? '▸' : '▾';
    });

    wireAddDomain(body, key, domains, customData);

    panel.appendChild(header);
    panel.appendChild(body);
    container.appendChild(panel);
  }
}

function buildDomainList(presetKey, domains, customData) {
  const tags = domains.map((d) => {
    const isCustomAdded = customData.add.includes(d);
    return `
      <li class="domain-tag" data-domain="${d}">
        ${d}
        <button data-preset="${presetKey}" data-domain="${d}" title="Remove" aria-label="Remove ${d}">×</button>
      </li>
    `;
  }).join('');

  return `
    <ul class="domain-list">${tags || '<li style="color:var(--text-muted);font-size:13px">No domains</li>'}</ul>
    <div class="add-domain-row">
      <input type="text" placeholder="add domain (e.g. twitch.tv)" class="add-domain-input" />
      <button class="add-domain-btn" data-preset="${presetKey}">Add</button>
    </div>
  `;
}

function wireAddDomain(body, presetKey, currentDomains, customData) {
  body.addEventListener('click', async (e) => {
    // Remove domain
    if (e.target.matches('button[data-domain]')) {
      const domain = e.target.dataset.domain;
      if (customData.add.includes(domain)) {
        customData.add = customData.add.filter((d) => d !== domain);
      } else {
        if (!customData.remove.includes(domain)) customData.remove.push(domain);
      }
      await saveCustomization(presetKey, customData);
      await refreshPanel(body, presetKey, customData);
    }

    // Add domain
    if (e.target.matches('.add-domain-btn')) {
      const input = body.querySelector('.add-domain-input');
      const domain = input.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!domain) return;
      if (!customData.add.includes(domain)) customData.add.push(domain);
      customData.remove = customData.remove.filter((d) => d !== domain);
      await saveCustomization(presetKey, customData);
      input.value = '';
      await refreshPanel(body, presetKey, customData);
    }
  });
}

async function refreshPanel(body, presetKey, customData) {
  const domains = await getBlockList(presetKey);
  body.innerHTML = buildDomainList(presetKey, domains, customData);
  wireAddDomain(body, presetKey, domains, customData);
}

async function getCustomData(key) {
  const result = await chrome.storage.local.get(`blocklist_custom_${key}`);
  return result[`blocklist_custom_${key}`] || { add: [], remove: [] };
}

// --- Sin history ---

async function buildSinHistory() {
  const container = document.getElementById('sin-history');

  const all = await getHistory();
  const sessions = all.filter((s) => s.sins?.length > 0);

  if (sessions.length === 0) {
    container.innerHTML = '<p class="sin-empty">No sins on record. Keep it that way.</p>';
    return;
  }

  sessions.forEach((session) => {
    const el = document.createElement('div');
    el.className = 'sin-session';

    const sinItems = session.sins.map((sin) => `
      <li class="sin-entry">
        <span class="sin-domain">${sin.domain}</span>
        <span class="sin-time">${new Date(sin.at).toLocaleTimeString()}</span>
      </li>
    `).join('');

    el.innerHTML = `
      <div class="sin-session-header">
        <div class="sin-session-intention">"${session.intention}"</div>
        <div class="sin-session-meta">
          ${new Date(session.startedAt).toLocaleDateString()} · ${session.sins.length} sin${session.sins.length === 1 ? '' : 's'}
        </div>
      </div>
      <ul class="sin-list">${sinItems}</ul>
    `;

    container.appendChild(el);
  });
}
