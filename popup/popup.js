import { PRESETS, getBlockList } from '../src/blockLists.js';
import { isActive, timeRemainingMs } from '../src/session.js';

// --- State ---
let selectedPreset = null;
let timerInterval = null;

// --- DOM refs ---
const views = {
  prayer: document.getElementById('view-prayer'),
  commit: document.getElementById('view-commit'),
  active: document.getElementById('view-active'),
  summary: document.getElementById('view-summary'),
};

const $ = (id) => document.getElementById(id);

// --- Init ---
(async () => {
  buildPresetGrid();
  wireEvents();

  const session = await sendMsg({ type: 'GET_SESSION' });
  if (!session) return showView('prayer');

  if (session.status === 'active') {
    showActiveView(session);
  } else if (session.status === 'complete') {
    showSummaryView(session);
  }
})();

// --- Build preset grid ---
function buildPresetGrid() {
  const grid = document.getElementById('preset-grid');
  Object.entries(PRESETS).forEach(([key, preset]) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.key = key;
    btn.innerHTML = `<span class="preset-name">${preset.label}</span>${preset.description}`;
    btn.addEventListener('click', () => selectPreset(key));
    grid.appendChild(btn);
  });
}

function selectPreset(key) {
  selectedPreset = key;
  document.querySelectorAll('.preset-btn').forEach((b) => {
    b.classList.toggle('selected', b.dataset.key === key);
  });
  validateForm();
}

// --- Duration buttons ---
function wireEvents() {
  document.querySelectorAll('.dur-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('duration').value = btn.dataset.min;
      document.querySelectorAll('.dur-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  $('intention').addEventListener('input', validateForm);
  $('duration').addEventListener('input', validateForm);

  $('btn-pray').addEventListener('click', onPrayClick);
  $('btn-begin').addEventListener('click', onBeginClick);
  $('btn-cancel-commit').addEventListener('click', () => showView('prayer'));
  $('btn-end-session').addEventListener('click', onEndSession);
  $('btn-pray-again').addEventListener('click', onPrayAgain);
}

function validateForm() {
  const hasIntention = $('intention').value.trim().length > 0;
  const hasDuration = parseInt($('duration').value) > 0;
  $('btn-pray').disabled = !(hasIntention && hasDuration && selectedPreset);
}

// --- Prayer flow ---
function onPrayClick() {
  const intention = $('intention').value.trim();
  $('commit-intention-text').textContent = `"${intention}"`;
  showView('commit');
}

async function onBeginClick() {
  const intention = $('intention').value.trim();
  const durationMinutes = parseInt($('duration').value);
  const blockList = await getBlockList(selectedPreset);

  const session = {
    intention,
    durationMinutes,
    presetKey: selectedPreset,
    blockList,
    startedAt: Date.now(),
    status: 'active',
    sins: [],
    tempUnblocked: [],
  };

  await sendMsg({ type: 'START_SESSION', session });
  showActiveView(session);
}

// --- Active view ---
function showActiveView(session) {
  $('active-intention-text').textContent = `"${session.intention}"`;
  updateSinBadge(session.sins?.length || 0);
  showView('active');
  startTimer(session);
}

function startTimer(session) {
  clearInterval(timerInterval);
  const tick = () => {
    const ms = timeRemainingMs(session);
    $('timer-display').textContent = formatTime(ms);
    if (ms <= 0) {
      clearInterval(timerInterval);
      // Background will have ended it; reload to show summary
      setTimeout(() => window.location.reload(), 500);
    }
  };
  tick();
  timerInterval = setInterval(tick, 1000);
}

function updateSinBadge(count) {
  const badge = $('sin-count-badge');
  badge.textContent = count === 0 ? 'No sins' : `${count} sin${count === 1 ? '' : 's'}`;
  badge.style.borderColor = count > 0 ? 'var(--sin)' : 'var(--border)';
  badge.style.color = count > 0 ? 'var(--sin-light)' : 'var(--text-muted)';
}

async function onEndSession() {
  if (!confirm('End your session early? Your commitment deserves better.')) return;
  await sendMsg({ type: 'END_SESSION' });
  window.location.reload();
}

// --- Summary view ---
function showSummaryView(session) {
  $('summary-intention-text').textContent = `"${session.intention}"`;

  const elapsed = session.endedAt
    ? Math.floor((session.endedAt - session.startedAt) / 60000)
    : session.durationMinutes;
  $('summary-duration').textContent = `${elapsed}m`;

  const sinCount = session.sins?.length || 0;
  $('summary-sins').textContent = sinCount;
  $('summary-reflection').textContent = reflectionLine(sinCount);

  showView('summary');
}

function reflectionLine(sins) {
  if (sins === 0) return 'You held the line. That was real.';
  if (sins === 1) return 'One moment of weakness. You are still learning.';
  if (sins <= 3) return 'The distractions pulled at you. Keep showing up.';
  return 'Next time, let the prayer hold you longer.';
}

function onPrayAgain() {
  sendMsg({ type: 'END_SESSION' });
  showView('prayer');
  selectedPreset = null;
  $('intention').value = '';
  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('selected'));
  validateForm();
}

// --- Utils ---
function showView(name) {
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}
