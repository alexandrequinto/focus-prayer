import { PRESETS, getBlockList } from '../src/blockLists.js';
import { timeRemainingMs } from '../src/session.js';

// --- State ---
let selectedPreset = null;
let timerInterval = null;
let beginUnlockTimer = null;

// --- DOM refs ---
const views = {
  prayer: document.getElementById('view-prayer'),
  commit: document.getElementById('view-commit'),
  active: document.getElementById('view-active'),
  summary: document.getElementById('view-summary'),
};

const $ = (id) => document.getElementById(id);

// --- Reflection copy pools ---
const REFLECTIONS_CLEAN = [
  'You held the line. That was real.',
  'Every minute was yours. Well done.',
  'You showed up for yourself.',
  'The prayer was answered.',
  'Unbroken. Remember this feeling.',
];

const REFLECTIONS_ONE = [
  'One moment of weakness. The rest was yours.',
  'You slipped once. You stayed for everything else.',
  'One sin. File it away. Come back stronger.',
];

const REFLECTIONS_FEW = [
  'The pull was strong today. Keep showing up.',
  'A few breaks. The commitment still counts.',
  'You came back each time. That matters.',
];

const REFLECTIONS_MANY = [
  'The distractions won this round. Next prayer, let it hold.',
  'This one got away from you. You know what to do differently.',
  'Scattered. It happens. The prayer is still worth making.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function reflectionLine(sins) {
  if (sins === 0) return pick(REFLECTIONS_CLEAN);
  if (sins === 1) return pick(REFLECTIONS_ONE);
  if (sins <= 3) return pick(REFLECTIONS_FEW);
  return pick(REFLECTIONS_MANY);
}

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

// --- Wire events ---
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
  $('btn-cancel-commit').addEventListener('click', onCancelCommit);
  $('btn-end-session').addEventListener('click', onEndSession);
  $('btn-pray-again').addEventListener('click', onPrayAgain);
}

function validateForm() {
  // Intention is optional — blank = "Silence"
  const hasDuration = parseInt($('duration').value) > 0;
  $('btn-pray').disabled = !(hasDuration && selectedPreset);
}

// --- Prayer flow ---
function onPrayClick() {
  const raw = $('intention').value.trim();
  const intention = raw || 'Silence';
  const display = raw ? `"${raw}"` : 'Silence.';
  $('commit-intention-text').textContent = display;

  // Store resolved intention for Begin
  $('btn-begin').dataset.intention = intention;

  showView('commit');

  // Lock Begin for 2.5s — let the breath land
  $('btn-begin').disabled = true;
  clearTimeout(beginUnlockTimer);
  beginUnlockTimer = setTimeout(() => {
    $('btn-begin').disabled = false;
  }, 2500);
}

function onCancelCommit() {
  clearTimeout(beginUnlockTimer);
  showView('prayer');
}

async function onBeginClick() {
  const intention = $('btn-begin').dataset.intention || 'Silence';
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
  const label = session.intention === 'Silence' ? 'Silence.' : `"${session.intention}"`;
  $('active-intention-text').textContent = label;
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
  const label = session.intention === 'Silence' ? 'Silence.' : `"${session.intention}"`;
  $('summary-intention-text').textContent = label;

  const elapsed = session.endedAt
    ? Math.max(1, Math.floor((session.endedAt - session.startedAt) / 60000))
    : session.durationMinutes;
  $('summary-duration').textContent = `${elapsed}m`;

  const sinCount = session.sins?.length || 0;
  $('summary-sins').textContent = sinCount;
  $('summary-reflection').textContent = reflectionLine(sinCount);

  showView('summary');
}

function onPrayAgain() {
  clearInterval(timerInterval);
  sendMsg({ type: 'CLEAR_SESSION' });
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
